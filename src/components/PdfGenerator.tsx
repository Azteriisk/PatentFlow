import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { PatentDocument, TrademarkDocument } from "../services/db";

// PDF Styling layout
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0ea5e9",
    paddingBottom: 12,
    marginBottom: 20,
  },
  titleArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    maxWidth: "75%",
  },
  category: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0ea5e9",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaRightLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaRightValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0ea5e9",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridCol6: {
    width: "50%",
    paddingRight: 10,
    marginBottom: 8,
  },
  gridCol12: {
    width: "100%",
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 9.5,
    color: "#1e293b",
  },
  valueBold: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  abstract: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#334155",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  chip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8.5,
    color: "#475569",
  },
  timelineItem: {
    borderLeftWidth: 1.5,
    borderLeftColor: "#e2e8f0",
    marginLeft: 6,
    paddingLeft: 12,
    paddingBottom: 10,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0ea5e9",
    position: "absolute",
    left: -4,
    top: 3,
  },
  timelineTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#334155",
  },
  timelineMeta: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
  }
});

// Helper for formatting date
const formatPdfDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ==========================================
// 1. Patent PDF Document Layout
// ==========================================
const PatentPdfDocument = ({ patent }: { patent: PatentDocument }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.category}>{patent.appType || "Utility"} Patent Application</Text>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{patent.simplifiedTitle || patent.patentTitle}</Text>
          <View style={styles.metaRight}>
            <Text style={styles.metaRightLabel}>Application ID</Text>
            <Text style={styles.metaRightValue}>{patent.applId}</Text>
          </View>
        </View>
      </View>

      {/* Identifiers Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bibliographic Details</Text>
        <View style={styles.grid}>
          <View style={styles.gridCol6}>
            <Text style={styles.label}>Filing Date</Text>
            <Text style={styles.value}>{formatPdfDate(patent.appFilingDate)}</Text>
          </View>
          {patent.patentNumber && (
            <View style={styles.gridCol6}>
              <Text style={styles.label}>Patent Issued Number</Text>
              <Text style={styles.valueBold}>{patent.patentNumber}</Text>
            </View>
          )}
          {patent.patentIssueDate && (
            <View style={styles.gridCol6}>
              <Text style={styles.label}>Issue Grant Date</Text>
              <Text style={styles.value}>{formatPdfDate(patent.patentIssueDate)}</Text>
            </View>
          )}
          <View style={styles.gridCol6}>
            <Text style={styles.label}>USPTO Classification</Text>
            <Text style={styles.value}>{patent.appClsSubCls || "N/A"}</Text>
          </View>
          {patent.assigneeName && (
            <View style={styles.gridCol12}>
              <Text style={styles.label}>Current Assignee / Owner</Text>
              <Text style={styles.valueBold}>{patent.assigneeName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Abstract */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abstract & Description</Text>
        <Text style={styles.abstract}>{patent.appAbstract}</Text>
      </View>

      {/* Inventors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventors</Text>
        <View style={styles.chipContainer}>
          {patent.rankAndInventorsList && patent.rankAndInventorsList.length > 0 ? (
            patent.rankAndInventorsList.map((inventor, index) => (
              <Text key={index} style={styles.chip}>
                {inventor}
              </Text>
            ))
          ) : (
            <Text style={styles.chip}>{patent.primaryInventor || "Unknown Inventor"}</Text>
          )}
        </View>
      </View>

      {/* Status Timeline History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filing status & Milestones</Text>
        <View style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <Text style={styles.timelineTitle}>{patent.appStatus || "Application Logged"}</Text>
          {patent.appFilingDate && (
            <Text style={styles.timelineMeta}>
              Official unexamined status captured. Filed on {formatPdfDate(patent.appFilingDate)}.
            </Text>
          )}
        </View>
        
        {patent.assignmentRecordedDate && (
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineTitle}>Ownership Record Transfer</Text>
            <Text style={styles.timelineMeta}>
              Conveyance: {patent.conveyanceText || "Assignment of Interest"}. Recorded on {formatPdfDate(patent.assignmentRecordedDate)}.
            </Text>
          </View>
        )}
      </View>

      {/* Page Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PatentFlow • Secure Local USPTO Discovery Report</Text>
        <Text style={styles.footerText}>Generated client-side • Sandbox Protected</Text>
      </View>
    </Page>
  </Document>
);

// ==========================================
// 2. Trademark PDF Document Layout
// ==========================================
const TrademarkPdfDocument = ({ trademark }: { trademark: TrademarkDocument }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.category}>USPTO TSDR Trademark Case Status</Text>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{trademark.markElement || "Word/Logo Mark"}</Text>
          <View style={styles.metaRight}>
            <Text style={styles.metaRightLabel}>Serial Number</Text>
            <Text style={styles.metaRightValue}>{trademark.serialNumber}</Text>
          </View>
        </View>
      </View>

      {/* Case Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trademark registration details</Text>
        <View style={styles.grid}>
          <View style={styles.gridCol6}>
            <Text style={styles.label}>Filing Date</Text>
            <Text style={styles.value}>{formatPdfDate(trademark.filingDate)}</Text>
          </View>
          {trademark.registrationNumber && (
            <View style={styles.gridCol6}>
              <Text style={styles.label}>Registration Number</Text>
              <Text style={styles.valueBold}>{trademark.registrationNumber}</Text>
            </View>
          )}
          {trademark.registrationDate && (
            <View style={styles.gridCol6}>
              <Text style={styles.label}>Registration Date</Text>
              <Text style={styles.value}>{formatPdfDate(trademark.registrationDate)}</Text>
            </View>
          )}
          <View style={styles.gridCol6}>
            <Text style={styles.label}>Proprietor / owner</Text>
            <Text style={styles.valueBold}>{trademark.ownerName}</Text>
          </View>
        </View>
      </View>

      {/* Status Classification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Classification Summary</Text>
        <View style={styles.abstract}>
          <Text style={styles.valueBold}>{trademark.statusCategory.toUpperCase()}</Text>
          <Text style={[styles.value, { marginTop: 4, lineHeight: 1.35 }]}>{trademark.statusDescription}</Text>
          {trademark.markDrawingDescription && (
            <Text style={[styles.value, { marginTop: 6, color: "#64748b", fontSize: 8.5 }]}>
              Drawing: {trademark.markDrawingDescription}
            </Text>
          )}
        </View>
      </View>

      {/* Goods and Services Classifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goods & Services Classifications</Text>
        {trademark.goodsServices && trademark.goodsServices.length > 0 ? (
          trademark.goodsServices.map((gs, idx) => (
            <View key={idx} style={{ marginBottom: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#f1f5f9" }}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#0ea5e9", fontSize: 8.5, marginBottom: 2 }}>
                Class {gs.class}
              </Text>
              <Text style={styles.value}>{gs.description}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.value, { fontStyle: "italic" }]}>No goods or services classes returned.</Text>
        )}
      </View>

      {/* Page Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PatentFlow • Secure Local Trademark TSDR Report</Text>
        <Text style={styles.footerText}>Generated client-side • Sandbox Protected</Text>
      </View>
    </Page>
  </Document>
);

// ==========================================
// 3. Export Downloader Triggers (On-Demand)
// ==========================================
export const downloadPatentPdf = async (patent: PatentDocument) => {
  try {
    const doc = <PatentPdfDocument patent={patent} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const cleanTitle = (patent.simplifiedTitle || patent.patentTitle || "patent_summary")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30);
    link.download = `patent_summary_${patent.applId}_${cleanTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to generate Patent PDF summary:", e);
    alert("Could not generate PDF summary. Please try again.");
  }
};

export const downloadTrademarkPdf = async (trademark: TrademarkDocument) => {
  try {
    const doc = <TrademarkPdfDocument trademark={trademark} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const cleanTitle = (trademark.markElement || "trademark_summary")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30);
    link.download = `trademark_summary_${trademark.serialNumber}_${cleanTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to generate Trademark PDF summary:", e);
    alert("Could not generate PDF summary. Please try again.");
  }
};
