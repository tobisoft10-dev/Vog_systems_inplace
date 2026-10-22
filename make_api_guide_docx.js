import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import fs from "fs";
import path from "path";

const mdPath = path.join(process.cwd(), "SERVER_API_GUIDE.md");
const docxPath = path.join(process.cwd(), "SERVER_API_GUIDE.docx");
const updatedDocxPath = path.join(process.cwd(), "SERVER_API_GUIDE_UPDATED.docx");

function convertMdToDocx(mdText) {
    const lines = mdText.split(/\r?\n/);
    const children = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("```")) {
            if (inCodeBlock) {
                // Render code block inside a Single-Cell Table Container with cantSplit: true
                // This creates a beautiful, readable code callout box in Word that never splits across page breaks!
                const codeParagraphs = codeBuffer.map((codeLine) => {
                    return new Paragraph({
                        children: [
                            new TextRun({
                                text: codeLine || " ",
                                font: "Consolas",
                                size: 19, // 9.5pt
                                color: "0F172A",
                            }),
                        ],
                        spacing: { before: 15, after: 15, line: 240 },
                    });
                });

                const codeTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            cantSplit: true, // Prevents code box from splitting across page breaks
                            children: [
                                new TableCell({
                                    shading: { fill: "F8FAFC" },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                                        right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                                        left: { style: BorderStyle.SINGLE, size: 24, color: "2563EB" }, // Thick blue accent line
                                    },
                                    margins: {
                                        top: 140,
                                        bottom: 140,
                                        left: 200,
                                        right: 200,
                                    },
                                    children: codeParagraphs,
                                }),
                            ],
                        }),
                    ],
                });

                children.push(codeTable);

                // Spacing after table
                children.push(
                    new Paragraph({
                        text: "",
                        spacing: { before: 100, after: 140 },
                    })
                );

                codeBuffer = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                codeBuffer = [];
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
        }

        if (line.startsWith("# ")) {
            children.push(
                new Paragraph({
                    text: line.replace("# ", "").trim().toUpperCase(),
                    heading: HeadingLevel.TITLE,
                    alignment: "center",
                    keepWithNext: true,
                    spacing: { before: 200, after: 300 },
                })
            );
        } else if (line.startsWith("## ")) {
            children.push(
                new Paragraph({
                    text: line.replace("## ", "").trim(),
                    heading: HeadingLevel.HEADING_1,
                    keepWithNext: true,
                    spacing: { before: 400, after: 180 },
                })
            );
        } else if (line.startsWith("### ")) {
            const headingText = line.replace("### ", "").trim();
            const isSubEndpoint = /^2\.\d+/.test(headingText) && !headingText.startsWith("2.1.");

            children.push(
                new Paragraph({
                    text: headingText,
                    heading: HeadingLevel.HEADING_2,
                    keepWithNext: true,
                    pageBreakBefore: isSubEndpoint, // Each endpoint starts cleanly on a fresh page
                    spacing: { before: 300, after: 140 },
                })
            );
        } else if (line.startsWith("#### ")) {
            children.push(
                new Paragraph({
                    text: line.replace("#### ", "").trim(),
                    heading: HeadingLevel.HEADING_3,
                    keepWithNext: true,
                    spacing: { before: 200, after: 100 },
                })
            );
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            const cleanLine = line.replace(/^[-*]\s+/, "");
            children.push(
                new Paragraph({
                    bullet: { level: 0 },
                    children: parseFormattedText(cleanLine),
                    keepLines: true,
                    keepWithNext: true,
                    spacing: { before: 60, after: 60 },
                })
            );
        } else if (/^\d+\.\s+/.test(line)) {
            const cleanLine = line.replace(/^\d+\.\s+/, "");
            children.push(
                new Paragraph({
                    bullet: { level: 0 },
                    children: parseFormattedText(cleanLine),
                    keepLines: true,
                    keepWithNext: true,
                    spacing: { before: 60, after: 60 },
                })
            );
        } else if (line.trim() === "---") {
            children.push(
                new Paragraph({
                    text: "_________________________________________________________________________________",
                    keepWithNext: true,
                    spacing: { before: 200, after: 200 },
                })
            );
        } else if (line.trim().length > 0) {
            children.push(
                new Paragraph({
                    children: parseFormattedText(line),
                    keepLines: true,
                    spacing: { before: 80, after: 80 },
                })
            );
        }
    }

    return new Document({
        creator: "VOG Enterprise",
        title: "VOG Tekstil Premium - Web Servis & API Entegrasyon Rehberi",
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });
}

function parseFormattedText(text) {
    const runs = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|[^*`]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const part = match[0];
        if (part.startsWith("**") && part.endsWith("**")) {
            runs.push(
                new TextRun({
                    text: part.slice(2, -2),
                    bold: true,
                })
            );
        } else if (part.startsWith("`") && part.endsWith("`")) {
            runs.push(
                new TextRun({
                    text: part.slice(1, -1),
                    font: "Consolas",
                    bold: true,
                    color: "2563EB",
                })
            );
        } else {
            runs.push(
                new TextRun({
                    text: part,
                })
            );
        }
    }

    return runs;
}

const mdContent = fs.readFileSync(mdPath, "utf8");
const doc = convertMdToDocx(mdContent);

Packer.toBuffer(doc).then((buffer) => {
    let saved = false;
    try {
        fs.writeFileSync(docxPath, buffer);
        console.log("✅ SERVER_API_GUIDE.docx premium tablo kod kutuları (cantSplit + Consolas 9.5pt) ile başarıyla oluşturuldu.");
        saved = true;
    } catch (err) {
        console.log("⚠️ SERVER_API_GUIDE.docx kilitli, SERVER_API_GUIDE_UPDATED.docx olarak yazılıyor...");
    }

    try {
        fs.writeFileSync(updatedDocxPath, buffer);
        console.log("✅ SERVER_API_GUIDE_UPDATED.docx premium tablo kod kutuları (cantSplit + Consolas 9.5pt) ile başarıyla oluşturuldu.");
    } catch (err) {}
});
