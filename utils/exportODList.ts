import { TeamRegistration, TeamMember } from '../types';

const getShortForm = (branch: string): string => {
    const b = (branch || "Unknown Course").trim().toUpperCase();
    if (b.includes("DATA SCIENCE") || b === "DS") return "DS";
    if (b.includes("CLOUD") || b === "CLOUD COMPUTING") return "CLOUD";
    if (b.includes("CYBER") || b === "CYS" || b === "CYBER SECURITY")
        return "CYBER";
    if (b.includes("AIML")) return "AIML";
    if (b.includes("CSBS")) return "CSBS";
    if (b.includes("ECE")) return "ECE";
    if (b.includes("CORE") || b === "CSE" || b === "COMPUTER SCIENCE")
        return "CORE";
    return b;
};

const branchOrder = (branch: string): number => {
    const b = (branch || "").toUpperCase().trim();
    if (b === "CORE") return 1;
    if (b === "AIML") return 2;
    if (b === "DS") return 3;
    if (b === "CLOUD") return 4;
    if (b === "ECE") return 5;
    if (b === "CYBER") return 6;
    if (b === "CSBS") return 7;
    return 8;
};

interface GroupedData {
    branch: string;
    year: string;
    members: TeamMember[];
}

export const exportODListExcel = async (
    registrations: TeamRegistration[],
    eventName: string,
): Promise<void> => {
    // 1) Gather members
    const allMembers: TeamMember[] = [];
    registrations.forEach((r) => {
        // Collect Lead
        allMembers.push({
            name: r.leadName,
            role: 'Lead',
            email: r.leadEmail,
            semester: r.leadSemester,
            regNo: r.leadRegNo,
            phone: r.leadPhone,
            section: r.leadSection,
            department: r.leadDepartment,
            altEmail: r.leadAltEmail
        });

        if (r.members && Array.isArray(r.members)) {
            r.members.forEach((m) => {
                const b = m.department || r.leadDepartment || "";
                const y = m.semester || r.leadSemester || "";
                allMembers.push({ ...m, department: b, semester: y });
            });
        }
    });

    if (allMembers.length === 0) {
        alert("No members found to export.");
        return;
    }

    // 2) Group by (Branch + Year)
    const groups: Record<string, GroupedData> = {};
    allMembers.forEach((m) => {
        const shortBranch = getShortForm(m.department ?? "");
        let y = (m.semester || "")
            .toString()
            .toUpperCase()
            .replace(/[^0-9]/g, "");
        if (!y) y = "1";

        // Format to roman Numeral Year
        // Assuming semester: 1, 2 = Year I; 3, 4 = Year II; 5, 6 = Year III; 7, 8 = Year IV
        const semNum = parseInt(y, 10) || 1;
        let yearNum = Math.ceil(semNum / 2).toString();

        let yearFormatted = "I";
        if (yearNum === "2") yearFormatted = "II";
        else if (yearNum === "3") yearFormatted = "III";
        else if (yearNum === "4") yearFormatted = "IV";
        else if (yearNum.length > 2) yearFormatted = yearNum;

        const key = `${shortBranch}-${yearFormatted}`;
        if (!groups[key]) {
            groups[key] = { branch: shortBranch, year: yearFormatted, members: [] };
        }
        groups[key].members.push(m);
    });

    // 3) Sort branches and years
    const sortedGroupKeys = Object.keys(groups).sort((keyA, keyB) => {
        const groupA = groups[keyA]!;
        const groupB = groups[keyB]!;
        const branchA = groupA.branch;
        const branchB = groupB.branch;
        const orderA = branchOrder(branchA);
        const orderB = branchOrder(branchB);
        if (orderA !== orderB) return orderA - orderB;
        if (branchA !== branchB) return branchA.localeCompare(branchB);

        const yearA = groupA.year;
        const yearB = groupB.year;
        return yearA.localeCompare(yearB);
    });

    // 4) Execute ExcelJS builder
    import("exceljs")
        .then(async (ExcelJSModule) => {
            const ExcelJS = ExcelJSModule.default || ExcelJSModule;
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("OD List");

            sheet.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

            // Set column widths
            sheet.columns = [
                { width: 8 }, // S.No
                { width: 18 }, // Reg No
                { width: 28 }, // Name
                { width: 12 }, // Section
                { width: 12 }, // Date
                { width: 10 }, // From
                { width: 10 }, // To
            ];

            let currentRow = 1;

            sortedGroupKeys.forEach((key, groupIdx) => {
                const group = groups[key]!;

                group.members.sort((a: TeamMember, b: TeamMember) => {
                    const secA = (a.section || "").toUpperCase();
                    const secB = (b.section || "").toUpperCase();
                    if (secA !== secB) return secA < secB ? -1 : 1;
                    const nameA = (a.name || "").toUpperCase();
                    const nameB = (b.name || "").toUpperCase();
                    return nameA.localeCompare(nameB);
                });

                if (groupIdx > 0) {
                    currentRow += 2; // Gap between groups
                }

                // Logos row
                sheet.getRow(currentRow).height = 45;
                sheet.getCell(`A${currentRow}`).value = "[LOGO LEFT]";
                sheet.getCell(`A${currentRow}`).font = {
                    bold: true,
                    color: { argb: "FF777777" },
                };
                sheet.getCell(`A${currentRow}`).alignment = {
                    vertical: "middle",
                    horizontal: "center",
                };
                sheet.mergeCells(`A${currentRow}:B${currentRow + 3}`);

                sheet.getCell(`F${currentRow}`).value = "[LOGO RIGHT]";
                sheet.getCell(`F${currentRow}`).font = {
                    bold: true,
                    color: { argb: "FF777777" },
                };
                sheet.getCell(`F${currentRow}`).alignment = {
                    vertical: "middle",
                    horizontal: "center",
                };
                sheet.mergeCells(`F${currentRow}:G${currentRow + 3}`);
                currentRow += 4; // skip logos rows (no gap)

                // Title
                sheet.getCell(`A${currentRow}`).value =
                    "Student Form for ATTENDANCE Request";
                sheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
                sheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" };
                sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                currentRow += 2; // gap

                // Event Name and Date
                sheet.getCell(`A${currentRow}`).value = "Name of the event:";
                sheet.getCell(`A${currentRow}`).font = { bold: true };
                sheet.getCell(`A${currentRow}`).alignment = { horizontal: "left" };
                sheet.mergeCells(`A${currentRow}:B${currentRow}`);

                sheet.getCell(`C${currentRow}`).value = eventName; // use passed param
                sheet.getCell(`C${currentRow}`).font = { bold: true };
                sheet.mergeCells(`C${currentRow}:D${currentRow}`);

                sheet.getCell(`E${currentRow}`).value = "Date of the event:";
                sheet.getCell(`E${currentRow}`).font = { bold: true };
                sheet.getCell(`E${currentRow}`).alignment = { horizontal: "right" };
                sheet.mergeCells(`E${currentRow}:F${currentRow}`);
                currentRow += 2; // gap

                // Course and Year
                sheet.getCell(`A${currentRow}`).value = "Course";
                sheet.getCell(`A${currentRow}`).font = { bold: true };

                sheet.getCell(`B${currentRow}`).value = group.branch;
                sheet.getCell(`B${currentRow}`).font = { bold: true };
                sheet.mergeCells(`B${currentRow}:C${currentRow}`);

                sheet.getCell(`E${currentRow}`).value = "Year / semester";
                sheet.getCell(`E${currentRow}`).font = { bold: true };
                sheet.getCell(`E${currentRow}`).alignment = { horizontal: "right" };
                sheet.mergeCells(`E${currentRow}:F${currentRow}`);

                sheet.getCell(`G${currentRow}`).value = group.year;
                sheet.getCell(`G${currentRow}`).font = { bold: true };
                currentRow += 2; // gap

                // Table Headers
                const borderStyle = {
                    top: { style: "thin" as const },
                    left: { style: "thin" as const },
                    bottom: { style: "thin" as const },
                    right: { style: "thin" as const },
                };

                // Add header values
                sheet.getCell(`A${currentRow}`).value = "S.No.";
                sheet.getCell(`B${currentRow}`).value = "Registration No.";
                sheet.getCell(`C${currentRow}`).value = "Name";
                sheet.getCell(`D${currentRow}`).value = "Section";
                sheet.getCell(`E${currentRow}`).value = "Date";
                sheet.getCell(`F${currentRow}`).value = "Hours";

                sheet.getCell(`F${currentRow + 1}`).value = "From";
                sheet.getCell(`G${currentRow + 1}`).value = "To";

                sheet.mergeCells(`A${currentRow}:A${currentRow + 1}`);
                sheet.mergeCells(`B${currentRow}:B${currentRow + 1}`);
                sheet.mergeCells(`C${currentRow}:C${currentRow + 1}`);
                sheet.mergeCells(`D${currentRow}:D${currentRow + 1}`);
                sheet.mergeCells(`E${currentRow}:E${currentRow + 1}`);
                sheet.mergeCells(`F${currentRow}:G${currentRow}`);

                // Style table headers
                for (let r = currentRow; r <= currentRow + 1; r++) {
                    for (let c = 1; c <= 7; c++) {
                        const cell = sheet.getCell(r, c);
                        cell.border = borderStyle;
                        cell.alignment = {
                            horizontal: "center",
                            vertical: "middle",
                            wrapText: true,
                        };
                    }
                }
                currentRow += 2;

                // Members Table
                group.members.forEach((m: TeamMember, i: number) => {
                    const section = (m.section || "").trim() || "-";
                    const sectionDisplay = parseInt(group.branch) ? `${group.branch}-${section}` : section === "-" ? "-" : `${group.branch}-${section}`;

                    const rowData = [
                        i + 1,
                        m.regNo || "",
                        m.name || "",
                        sectionDisplay,
                        "",
                        "",
                        "",
                    ];

                    const r = currentRow;
                    for (let c = 1; c <= 7; c++) {
                        const cell = sheet.getCell(r, c);
                        cell.value = rowData[c - 1];
                        cell.border = borderStyle;

                        // Centering for S.No, Reg No, Section
                        if (c === 1 || c === 2 || c === 4) {
                            cell.alignment = {
                                horizontal: "center",
                                vertical: "middle",
                                wrapText: true,
                            };
                        } else {
                            cell.alignment = { vertical: "middle", wrapText: true };
                        }
                    }
                    currentRow += 1;
                });

                currentRow += 3; // Gaps

                // Signatures Footers
                sheet.getCell(`A${currentRow}`).value = "Faculty Coordinator";
                sheet.getCell(`A${currentRow}`).font = { bold: true };
                sheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" };
                sheet.mergeCells(`A${currentRow}:B${currentRow}`);

                sheet.getCell(`C${currentRow}`).value = "Head Student Welfare";
                sheet.getCell(`C${currentRow}`).font = { bold: true };
                sheet.getCell(`C${currentRow}`).alignment = { horizontal: "center" };
                sheet.mergeCells(`C${currentRow}:E${currentRow}`);

                sheet.getCell(`F${currentRow}`).value = "HoD CSE";
                sheet.getCell(`F${currentRow}`).font = { bold: true };
                sheet.getCell(`F${currentRow}`).alignment = { horizontal: "center" };
                sheet.mergeCells(`F${currentRow}:G${currentRow}`);

                currentRow += 4; // Bottom Gaps
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `od-list-${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        })
        .catch((err) => {
            console.error("Error generating excel:", err);
            alert("Failed to export Excel file. Please try again.");
        });
};
