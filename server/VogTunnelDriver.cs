using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;

namespace VogTekstil.Rfid
{
    public class TagEvent
    {
        public string Epc;
        public int Rssi;
        public int Antenna = 1;
    }

    class Program
    {
        private static string IMPINJ_IP = "192.168.0.13";
        private static int IMPINJ_PORT = 5084;
        private static string VOG_SERVER = "http://192.168.1.251:3001";
        
        private static Dictionary<string, long> recentTags = new Dictionary<string, long>();
        private static double currentPower = 18.0;
        private static int currentRssiThreshold = -52; // Tünel dışı ortam parazitlerini eler

        private static byte[] BuildAntennaConfigPayload(bool resetFactory, int pwrIdx)
        {
            List<byte> parts = new List<byte>();
            parts.Add(resetFactory ? (byte)0x80 : (byte)0x00);
            for (byte antId = 0; antId <= 4; antId++)
            {
                // AntennaConfiguration (Type 187, Len 16)
                parts.AddRange(new byte[] {
                    0x00, 0xBB, 0x00, 0x10,
                    0x00, antId,
                    0x00, 0xE0, 0x00, 0x0A,
                    0x00, 0x00,
                    0x00, 0x00,
                    (byte)pwrIdx
                });
                if (antId >= 1)
                {
                    // AntennaProperties (Type 181, Len 5) -> IsConnected = true
                    parts.AddRange(new byte[] {
                        0x00, 0xB5, 0x00, 0x05,
                        0x01,
                        0x00, antId
                    });
                }
            }
            return parts.ToArray();
        }

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.Title = "VOG NATIVE IMPINJ RFID DRIVER (COMPILED)";
            
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("==================================================================");
            Console.WriteLine(" [VOG NATIVE IMPINJ DRIVER - C# NATIVE LLRP ENGINE (4 ANTEN)]");
            Console.WriteLine(" OKUYUCU HEDEFI : " + IMPINJ_IP + ":" + IMPINJ_PORT);
            Console.WriteLine(" VOG SUNUCU     : " + VOG_SERVER);
            Console.WriteLine(" BASLANGIC ESIK : " + currentRssiThreshold + " dBm");
            Console.WriteLine(" ANTEN SAYISI   : 4 Adet Port (1:Ust Sol, 2:Ust Sag, 3:Alt Sol, 4:Alt Sag)");
            Console.WriteLine("==================================================================");
            Console.ResetColor();
            Console.WriteLine();

            while (true)
            {
                TcpClient client = null;
                try
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("[IMPINJ] Baglanti kuruluyor -> " + IMPINJ_IP + ":" + IMPINJ_PORT + "...");
                    Console.ResetColor();

                    client = new TcpClient();
                    IAsyncResult ar = client.BeginConnect(IMPINJ_IP, IMPINJ_PORT, null, null);
                    bool success = ar.AsyncWaitHandle.WaitOne(4000);
                    if (!success || !client.Connected)
                    {
                        throw new Exception("Impinj okuyucuya baglanilamadi (Zaman asimi).");
                    }
                    client.EndConnect(ar);

                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[IMPINJ BAGLANDI] 4 Antenli Okuyucu ile LLRP Oturumu Acildi!");
                    Console.ResetColor();

                    NetworkStream stream = client.GetStream();
                    byte[] buffer = new byte[65536];

                    // 1. SET_READER_CONFIG (ResetToFactoryDefault: true -> 4 Anten Portu Devreye Aliniyor)
                    int pwrIdx = Math.Max(1, Math.Min(81, (int)Math.Round((currentPower - 10.0) / 0.25) + 1));
                    byte[] setConfigPayload = BuildAntennaConfigPayload(true, pwrIdx);
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine("[1/4] Impinj 4 Anten " + currentPower + " dBm Gucle Devreye Aliniyor (Index: " + pwrIdx + ")...");
                    Console.ResetColor();
                    SendLlrpMsg(stream, 3, setConfigPayload, 1);
                    Thread.Sleep(400);

                    // 2. DELETE_ALL_ROSPECS
                    SendLlrpMsg(stream, 21, new byte[] { 0x00, 0x00, 0x00, 0x00 }, 2);
                    Thread.Sleep(300);

                    // 3. ADD_ROSPEC (71-Byte Full LLRP ROSpec with 4 Antennas Active, Tag Reporting & PeakRSSI)
                    byte[] roSpecBytes = new byte[] {
                        0x00, 0xB1, 0x00, 0x47,
                        0x00, 0x00, 0x00, 0x01, // ROSpecID = 1
                        0x00,                   // Priority = 0
                        0x00,                   // CurrentState = Disabled
                        
                        // ROBoundarySpec (Type 178, Length 18)
                        0x00, 0xB2, 0x00, 0x12,
                        0x00, 0xB3, 0x00, 0x05, 0x00, // StartTrigger: Null
                        0x00, 0xB6, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, // StopTrigger: Null
                        
                        // AISpec (Type 183, Length 30) - 4 Anten Portu (1, 2, 3, 4)
                        0x00, 0xB7, 0x00, 0x1E,
                        0x00, 0x04,                   // Antenna Count = 4 (TUM 4 ANTENI SIRAYLA ATESLE!)
                        0x00, 0x01,                   // Port 1 (Anten 1 - Ust Sol)
                        0x00, 0x02,                   // Port 2 (Anten 2 - Ust Sag)
                        0x00, 0x03,                   // Port 3 (Anten 3 - Alt Sol)
                        0x00, 0x04,                   // Port 4 (Anten 4 - Alt Sag)
                        
                        // AISpecStopTrigger (Type 184, Length 9)
                        0x00, 0xB8, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00,
                        
                        // InventoryParameterSpec (Type 186, Length 7)
                        0x00, 0xBA, 0x00, 0x07,
                        0x00, 0x01,                   // InventoryParameterSpecID = 1
                        0x01,                         // ProtocolID = EPCGlobal Class 1 Gen 2
                        
                        // ROReportSpec (Type 237, Length 13)
                        0x00, 0xED, 0x00, 0x0D,
                        0x01,                         // ROReportTrigger = Upon_N_Tags_Or_End_Of_ROSpec
                        0x00, 0x01,                   // N = 1 (Report immediately)
                        
                        // TagReportContentSelector (Type 238, Length 6)
                        0x00, 0xEE, 0x00, 0x06,
                        0xFF, 0xC0                    // Enable PeakRSSI (Bit 9) + AntennaID + All fields
                    };

                    SendLlrpMsg(stream, 20, roSpecBytes, 3);
                    Thread.Sleep(400);

                    // 4. ENABLE_ROSPEC & START_ROSPEC
                    SendLlrpMsg(stream, 24, new byte[] { 0x00, 0x00, 0x00, 0x01 }, 4);
                    Thread.Sleep(300);
                    SendLlrpMsg(stream, 22, new byte[] { 0x00, 0x00, 0x00, 0x01 }, 5);

                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[IMPINJ 4 ANTEN ATESLENDI] 4 Antenle canli tarama aktif! Kolileri tunelden gecirebilirsiniz.");
                    Console.ResetColor();
                    Console.WriteLine();

                    long lastSyncTime = DateTime.UtcNow.Ticks;

                    while (client.Connected)
                    {
                        // Sync Power & Filter from Kiosk status every 1.5 seconds
                        long nowTicks = DateTime.UtcNow.Ticks;
                        if ((nowTicks - lastSyncTime) > 15000000)
                        {
                            lastSyncTime = nowTicks;
                            SyncKioskSettings(stream);
                        }

                        if (stream.DataAvailable)
                        {
                            int bytesRead = stream.Read(buffer, 0, buffer.Length);
                            if (bytesRead <= 0) break;

                            int offset = 0;
                            while (offset <= bytesRead - 10)
                            {
                                int msgType = ((buffer[offset] << 8) | buffer[offset + 1]) & 0x03FF;
                                int msgLen = (buffer[offset + 2] << 24) | (buffer[offset + 3] << 16) | (buffer[offset + 4] << 8) | buffer[offset + 5];
                                int msgId = (buffer[offset + 6] << 24) | (buffer[offset + 7] << 16) | (buffer[offset + 8] << 8) | buffer[offset + 9];

                                if (msgLen < 10 || (offset + msgLen) > bytesRead) break;

                                if (msgType == 62) // Keepalive
                                {
                                    SendLlrpMsg(stream, 72, new byte[0], msgId);
                                }
                                else if (msgType == 61) // RO_ACCESS_REPORT
                                {
                                    List<TagEvent> tags = ParseRoAccessReport(buffer, offset + 10, msgLen - 10);
                                    long nowMs = DateTime.UtcNow.Ticks / 10000;
                                    foreach (TagEvent t in tags)
                                    {
                                        if (!string.IsNullOrEmpty(t.Epc) && t.Epc.Length >= 8)
                                        {
                                            if (t.Rssi >= currentRssiThreshold)
                                            {
                                                if (!recentTags.ContainsKey(t.Epc) || (nowMs - recentTags[t.Epc]) > 1200)
                                                {
                                                    recentTags[t.Epc] = nowMs;
                                                    Console.ForegroundColor = ConsoleColor.Cyan;
                                                    Console.WriteLine("[TUNEL OKUMA] EPC: " + t.Epc + " (RSSI: " + t.Rssi + " dBm >= Esik: " + currentRssiThreshold + " dBm) [ANTEN #" + t.Antenna + "]");
                                                    Console.ResetColor();
                                                    PostTagToVog(t.Epc, t.Rssi, t.Antenna);
                                                }
                                            }
                                            else
                                            {
                                                Console.ForegroundColor = ConsoleColor.DarkGray;
                                                Console.WriteLine("[ORTAM PARAZITI ELENDI] EPC: " + t.Epc + " (RSSI: " + t.Rssi + " dBm < Esik: " + currentRssiThreshold + " dBm) [ANTEN #" + t.Antenna + "]");
                                                Console.ResetColor();
                                            }
                                        }
                                    }
                                }

                                offset += msgLen;
                            }
                        }
                        else
                        {
                            Thread.Sleep(30);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.DarkYellow;
                    Console.WriteLine("[BAGLANTI KOPTI / HATA]: " + ex.Message);
                    Console.ResetColor();
                }
                finally
                {
                    if (client != null)
                    {
                        try { client.Close(); } catch { }
                    }
                }

                Console.WriteLine("3 saniye sonra otomatik tekrar baglanilacak...");
                Thread.Sleep(3000);
            }
        }

        private static void SendLlrpMsg(NetworkStream stream, int msgType, byte[] payload, int msgId)
        {
            int msgLen = 10 + payload.Length;
            int typeVal = 0x0400 | (msgType & 0x03FF);
            byte[] packet = new byte[msgLen];
            packet[0] = (byte)(typeVal >> 8);
            packet[1] = (byte)(typeVal & 0xFF);
            packet[2] = (byte)(msgLen >> 24);
            packet[3] = (byte)((msgLen >> 16) & 0xFF);
            packet[4] = (byte)((msgLen >> 8) & 0xFF);
            packet[5] = (byte)(msgLen & 0xFF);
            packet[6] = (byte)(msgId >> 24);
            packet[7] = (byte)((msgId >> 16) & 0xFF);
            packet[8] = (byte)((msgId >> 8) & 0xFF);
            packet[9] = (byte)(msgId & 0xFF);

            if (payload.Length > 0)
            {
                Array.Copy(payload, 0, packet, 10, payload.Length);
            }

            stream.Write(packet, 0, packet.Length);
            stream.Flush();
        }

        private static void SyncKioskSettings(NetworkStream stream)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(VOG_SERVER + "/api/tunnel/kiosk/status");
                req.Timeout = 1000;
                req.Method = "GET";

                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                using (StreamReader reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                {
                    string json = reader.ReadToEnd();
                    
                    int pwrIdxPos = json.IndexOf("\"power\":");
                    if (pwrIdxPos != -1)
                    {
                        int endPos = json.IndexOfAny(new char[] { ',', '}' }, pwrIdxPos + 8);
                        if (endPos != -1)
                        {
                            string pwrStr = json.Substring(pwrIdxPos + 8, endPos - (pwrIdxPos + 8)).Trim();
                            double pwrVal;
                            if (double.TryParse(pwrStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out pwrVal))
                            {
                                if (Math.Abs(pwrVal - currentPower) > 0.2)
                                {
                                    currentPower = pwrVal;
                                    int tableIdx = Math.Max(1, Math.Min(81, (int)Math.Round((currentPower - 10.0) / 0.25) + 1));
                                    byte[] payload = BuildAntennaConfigPayload(false, tableIdx);
                                    SendLlrpMsg(stream, 3, payload, 99);
                                    Console.ForegroundColor = ConsoleColor.Cyan;
                                    Console.WriteLine("[GUC GUNCELLENDI] 4 Anten Gucu: " + currentPower + " dBm (Index: " + tableIdx + ") uygulandi.");
                                    Console.ResetColor();
                                }
                            }
                        }
                    }

                    int rssiPos = json.IndexOf("\"rssi_threshold\":");
                    if (rssiPos != -1)
                    {
                        int endPos = json.IndexOfAny(new char[] { ',', '}' }, rssiPos + 17);
                        if (endPos != -1)
                        {
                            string rssiStr = json.Substring(rssiPos + 17, endPos - (rssiPos + 17)).Trim();
                            int rssiVal;
                            if (int.TryParse(rssiStr, out rssiVal))
                            {
                                if (rssiVal != currentRssiThreshold)
                                {
                                    currentRssiThreshold = rssiVal;
                                    Console.ForegroundColor = ConsoleColor.Magenta;
                                    Console.WriteLine("[ESIK GUNCELLENDI] Sinyal Esigi: " + currentRssiThreshold + " dBm olarak ayarlandi.");
                                    Console.ResetColor();
                                }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void PostTagToVog(string epc, int rssi, int antenna = 1)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(VOG_SERVER + "/api/tunnel/kiosk/scan-tag");
                req.Timeout = 1500;
                req.Method = "POST";
                req.ContentType = "application/json";

                string json = "{\"rfid_tag\":\"" + epc + "\",\"rssi\":" + rssi + ",\"antenna\":" + antenna + ",\"reader_id\":\"VOG_IMPINJ_LLRP_013\"}";
                byte[] data = Encoding.UTF8.GetBytes(json);
                req.ContentLength = data.Length;

                using (Stream reqStream = req.GetRequestStream())
                {
                    reqStream.Write(data, 0, data.Length);
                }

                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("VOG Sunucusuna gonderilemedi (" + epc + "): " + ex.Message);
                Console.ResetColor();
            }
        }

        private static List<TagEvent> ParseRoAccessReport(byte[] buffer, int offset, int length)
        {
            List<TagEvent> tags = new List<TagEvent>();
            int end = offset + length;
            int pOff = offset;

            while (pOff <= end - 4)
            {
                int paramHeader = (buffer[pOff] << 8) | buffer[pOff + 1];
                bool isTv = (paramHeader & 0x8000) != 0;

                if (isTv)
                {
                    int tvType = (paramHeader >> 8) & 0x7F;
                    int size = (tvType == 13) ? 13 : ((tvType == 1 || tvType == 7 || tvType == 8) ? 3 : ((tvType == 2 || tvType == 3 || tvType == 4 || tvType == 5) ? 9 : 2));
                    if (pOff + size > end) break;

                    if (tvType == 13 && pOff + 13 <= end)
                    {
                        tags.Add(new TagEvent { Epc = ByteArrayToHex(buffer, pOff + 1, 12), Rssi = -50, Antenna = 1 });
                    }
                    pOff += size;
                }
                else
                {
                    int tlvType = paramHeader & 0x03FF;
                    int tlvLen = (buffer[pOff + 2] << 8) | buffer[pOff + 3];
                    if (tlvLen < 4 || pOff + tlvLen > end)
                    {
                        pOff += 4;
                        continue;
                    }

                    if (tlvType == 240) // TagReportData Container
                    {
                        ParseSingleTagReport(buffer, pOff + 4, tlvLen - 4, tags);
                    }
                    else if (tlvType == 241 && tlvLen >= 6) // EPCData
                    {
                        int bitCount = (buffer[pOff + 4] << 8) | buffer[pOff + 5];
                        int byteCount = (bitCount + 7) / 8;
                        if (pOff + 6 + byteCount <= end)
                        {
                            tags.Add(new TagEvent { Epc = ByteArrayToHex(buffer, pOff + 6, byteCount), Rssi = -50, Antenna = 1 });
                        }
                    }
                    pOff += tlvLen;
                }
            }
            return tags;
        }

        private static void ParseSingleTagReport(byte[] buffer, int offset, int length, List<TagEvent> tags)
        {
            int end = offset + length;
            int pOff = offset;
            string epc = null;
            int rssi = -80; // Varsayılan zayıf sinyal
            int antenna = 1;

            while (pOff <= end - 2)
            {
                int paramHeader = (buffer[pOff] << 8) | buffer[pOff + 1];
                bool isTv = (paramHeader & 0x8000) != 0;

                if (isTv)
                {
                    int tvType = (paramHeader >> 8) & 0x7F;
                    int size = (tvType == 13) ? 13 : ((tvType == 1 || tvType == 7 || tvType == 8) ? 3 : ((tvType == 2 || tvType == 3 || tvType == 4 || tvType == 5) ? 9 : 2));
                    if (pOff + size > end) break;

                    if (tvType == 13 && pOff + 13 <= end)
                    {
                        epc = ByteArrayToHex(buffer, pOff + 1, 12);
                    }
                    else if (tvType == 6 && pOff + 2 <= end) // LLRP Standard TV Type 6 = PeakRSSI (1 byte signed dBm)
                    {
                        rssi = (sbyte)buffer[pOff + 1];
                    }
                    else if (tvType == 1 && pOff + 3 <= end) // AntennaID TV Type 1 (2 bytes)
                    {
                        antenna = (buffer[pOff + 1] << 8) | buffer[pOff + 2];
                    }
                    pOff += size;
                }
                else
                {
                    if (pOff + 4 > end) break;
                    int tlvType = paramHeader & 0x03FF;
                    int tlvLen = (buffer[pOff + 2] << 8) | buffer[pOff + 3];
                    if (tlvLen < 4 || pOff + tlvLen > end)
                    {
                        pOff += 4;
                        continue;
                    }

                    if (tlvType == 241 && tlvLen >= 6) // EPCData
                    {
                        int bitCount = (buffer[pOff + 4] << 8) | buffer[pOff + 5];
                        int byteCount = (bitCount + 7) / 8;
                        if (pOff + 6 + byteCount <= end)
                        {
                            epc = ByteArrayToHex(buffer, pOff + 6, byteCount);
                        }
                    }
                    else if (tlvType == 245 && tlvLen >= 5) // PeakRSSI TLV Type 245
                    {
                        rssi = (sbyte)buffer[pOff + 4];
                    }
                    pOff += tlvLen;
                }
            }

            if (!string.IsNullOrEmpty(epc))
            {
                tags.Add(new TagEvent { Epc = epc, Rssi = rssi, Antenna = (antenna >= 1 && antenna <= 4) ? antenna : 1 });
            }
        }

        private static string ByteArrayToHex(byte[] bytes, int start, int length)
        {
            char[] c = new char[length * 2];
            for (int i = 0; i < length; i++)
            {
                byte b = bytes[start + i];
                c[i * 2] = GetHexValue(b >> 4);
                c[i * 2 + 1] = GetHexValue(b & 0xF);
            }
            return new string(c);
        }

        private static char GetHexValue(int i)
        {
            if (i < 10) return (char)(i + '0');
            return (char)(i - 10 + 'A');
        }
    }
}
