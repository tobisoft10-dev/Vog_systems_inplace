using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Runtime.InteropServices;
using System.ServiceProcess;

namespace VogTekstil.PrinterBridge
{
    public class RawPrinterHelper
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public class DOCINFOA
        {
            [MarshalAs(UnmanagedType.LPStr)]
            public string pDocName;
            [MarshalAs(UnmanagedType.LPStr)]
            public string pOutputFile;
            [MarshalAs(UnmanagedType.LPStr)]
            public string pDataType;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

        public static bool SendStringToPrinter(string szPrinterName, string szString, string docName)
        {
            IntPtr pBytes;
            int dwCount = szString.Length;
            pBytes = Marshal.StringToCoTaskMemAnsi(szString);
            bool success = SendBytesToPrinter(szPrinterName, pBytes, dwCount, docName);
            Marshal.FreeCoTaskMem(pBytes);
            return success;
        }

        public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, int dwCount, string docName)
        {
            int dwError = 0, dwWritten = 0;
            IntPtr hPrinter = new IntPtr(0);
            DOCINFOA di = new DOCINFOA();
            bool bSuccess = false;

            di.pDocName = docName ?? "VOG RFID PRINT JOB";
            di.pDataType = "RAW";

            if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero))
            {
                if (StartDocPrinter(hPrinter, 1, di))
                {
                    if (StartPagePrinter(hPrinter))
                    {
                        bSuccess = WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                        EndPagePrinter(hPrinter);
                    }
                    EndDocPrinter(hPrinter);
                }
                ClosePrinter(hPrinter);
            }
            if (!bSuccess)
            {
                dwError = Marshal.GetLastWin32Error();
            }
            return bSuccess;
        }
    }

    public class VogPrinterService : ServiceBase
    {
        private static string SERVER_URL = "http://192.168.1.251:3001";
        private static string SATO_PRINTER_NAME = "SATO CL4NX Plus 203dpi";
        private static string GODEX_PRINTER_NAME = "Godex G530";

        private Thread _workerThread;
        private volatile bool _stopping = false;

        public VogPrinterService()
        {
            this.ServiceName = "VogPrinterBridge";
            this.CanStop = true;
            this.CanShutdown = true;
            this.AutoLog = true;
        }

        protected override void OnStart(string[] args)
        {
            _stopping = false;
            _workerThread = new Thread(WorkerLoop);
            _workerThread.IsBackground = true;
            _workerThread.Start();
        }

        protected override void OnStop()
        {
            _stopping = true;
            if (_workerThread != null && _workerThread.IsAlive)
            {
                try { _workerThread.Abort(); } catch { }
            }
        }

        public void StartConsole()
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("VOG RFID & Koli Yazıcı Servisi Konsol Modunda Başlatıldı.");
            Console.WriteLine("Durdurmak için Enter tuşuna basınız...");
            OnStart(null);
            Console.ReadLine();
            OnStop();
        }

        private void WorkerLoop()
        {
            while (!_stopping)
            {
                try
                {
                    PollAndProcessJobs();
                }
                catch
                {
                    // Silent network retry
                }

                Thread.Sleep(800);
            }
        }

        private void PollAndProcessJobs()
        {
            string url = SERVER_URL + "/api/printer/jobs/poll";
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = "GET";
            req.Timeout = 5000;

            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            using (StreamReader reader = new StreamReader(resp.GetResponseStream()))
            {
                string json = reader.ReadToEnd();
                if (string.IsNullOrEmpty(json) || json.Contains("\"has_job\":false"))
                {
                    return;
                }

                int idPos = json.IndexOf("\"job_id\":");
                int typePos = json.IndexOf("\"printer_type\":");
                int rawDataPos = json.IndexOf("\"raw_commands\":");

                if (idPos != -1 && rawDataPos != -1)
                {
                    string jobId = ExtractJsonString(json, idPos + 9);
                    string printerType = ExtractJsonString(json, typePos + 15);
                    
                    int rawStart = json.IndexOf("\"", rawDataPos + 15) + 1;
                    int rawEnd = json.LastIndexOf("\"");
                    string rawCommands = json.Substring(rawStart, rawEnd - rawStart)
                        .Replace("\\n", "\n")
                        .Replace("\\r", "\r")
                        .Replace("\\\"", "\"")
                        .Replace("\\\\", "\\");

                    string targetPrinter = printerType.Contains("BOX") || printerType.Contains("GODEX") 
                        ? GODEX_PRINTER_NAME 
                        : SATO_PRINTER_NAME;

                    bool printSuccess = RawPrinterHelper.SendStringToPrinter(targetPrinter, rawCommands, "VOG_" + jobId);
                    if (printSuccess)
                    {
                        ReportJobStatus(jobId, "COMPLETED", null);
                    }
                    else
                    {
                        ReportJobStatus(jobId, "FAILED", "Windows RAW printer write failed");
                    }
                }
            }
        }

        private static string ExtractJsonString(string json, int startIdx)
        {
            int q1 = json.IndexOf("\"", startIdx);
            if (q1 == -1) return "";
            int q2 = json.IndexOf("\"", q1 + 1);
            if (q2 == -1) return "";
            return json.Substring(q1 + 1, q2 - q1 - 1);
        }

        private static void ReportJobStatus(string jobId, string status, string error)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(SERVER_URL + "/api/printer/jobs/complete");
                req.Method = "POST";
                req.ContentType = "application/json";
                req.Timeout = 3000;

                string body = "{\"job_id\":\"" + jobId + "\",\"status\":\"" + status + "\",\"error\":\"" + (error ?? "") + "\"}";
                byte[] bytes = Encoding.UTF8.GetBytes(body);
                req.ContentLength = bytes.Length;

                using (Stream st = req.GetRequestStream())
                {
                    st.Write(bytes, 0, bytes.Length);
                }

                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                }
            }
            catch { }
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            if (Environment.UserInteractive || (args.Length > 0 && args[0] == "-console"))
            {
                VogPrinterService svc = new VogPrinterService();
                svc.StartConsole();
            }
            else
            {
                ServiceBase.Run(new VogPrinterService());
            }
        }
    }
}
