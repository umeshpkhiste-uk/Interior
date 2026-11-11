import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatINR } from "@/lib/calculations/shared";
import type { QuotationPdfData } from "./quotation-pdf-data";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  orgName: { fontSize: 16, fontWeight: 700 },
  muted: { color: "#666666" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4, textAlign: "right" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: "#dddddd" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eeeeee" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3f3f3", borderBottomWidth: 1, borderColor: "#dddddd" },
  cellDescription: { flex: 4, padding: 5 },
  cellUnit: { flex: 1, padding: 5, textAlign: "right" },
  cellQty: { flex: 1, padding: 5, textAlign: "right" },
  cellRate: { flex: 1.5, padding: 5, textAlign: "right" },
  cellAmount: { flex: 1.5, padding: 5, textAlign: "right" },
  totalsBlock: { marginTop: 12, alignSelf: "flex-end", width: 260 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderColor: "#1a1a1a", marginTop: 4 },
  footer: { marginTop: 24, fontSize: 8, color: "#888888" },
});

export function QuotationDocument({ data }: { data: QuotationPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orgName}>{data.organizationName}</Text>
            {data.organizationAddress && <Text style={styles.muted}>{data.organizationAddress}</Text>}
            {data.organizationGstin && <Text style={styles.muted}>GSTIN: {data.organizationGstin}</Text>}
            {(data.organizationContactPhone || data.organizationContactEmail) && (
              <Text style={styles.muted}>
                {[data.organizationContactPhone, data.organizationContactEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.title}>QUOTATION</Text>
            <Text>{data.quotationNumber}</Text>
            <Text style={styles.muted}>Date: {data.quotationDate}</Text>
            {data.validityDate && <Text style={styles.muted}>Valid until: {data.validityDate}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Project</Text>
          <Text>{data.clientName}</Text>
          <Text>{data.projectName}</Text>
          {data.propertyAddress && <Text style={styles.muted}>{data.propertyAddress}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room-wise Summary</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.cellDescription}>Description</Text>
              <Text style={styles.cellUnit}>Unit</Text>
              <Text style={styles.cellQty}>Qty</Text>
              <Text style={styles.cellRate}>Rate</Text>
              <Text style={styles.cellAmount}>Amount</Text>
            </View>
            {data.roomLines.map((line, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.cellDescription}>{line.description}</Text>
                <Text style={styles.cellUnit}>{line.unit ?? ""}</Text>
                <Text style={styles.cellQty}>{line.quantity}</Text>
                <Text style={styles.cellRate}>{formatINR(line.rate)}</Text>
                <Text style={styles.cellAmount}>{formatINR(line.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {data.extraLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Items</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.cellDescription}>Description</Text>
                <Text style={styles.cellUnit}>Unit</Text>
                <Text style={styles.cellQty}>Qty</Text>
                <Text style={styles.cellRate}>Rate</Text>
                <Text style={styles.cellAmount}>Amount</Text>
              </View>
              {data.extraLines.map((line, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.cellDescription}>{line.description}</Text>
                  <Text style={styles.cellUnit}>{line.unit ?? ""}</Text>
                  <Text style={styles.cellQty}>{line.quantity}</Text>
                  <Text style={styles.cellRate}>{formatINR(line.rate)}</Text>
                  <Text style={styles.cellAmount}>{formatINR(line.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Rooms total</Text>
            <Text>{formatINR(data.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Contingency</Text>
            <Text>{formatINR(data.contingencyAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Gross amount</Text>
            <Text>{formatINR(data.grossAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Discount</Text>
            <Text>-{formatINR(data.discountAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Taxable amount</Text>
            <Text>{formatINR(data.taxableAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>GST ({(data.gstPct * 100).toFixed(1)}%)</Text>
            <Text>{formatINR(data.gstAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Round off</Text>
            <Text>{formatINR(data.roundOff, { decimals: true })}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={{ fontWeight: 700 }}>Grand Total</Text>
            <Text style={{ fontWeight: 700 }}>{formatINR(data.grandTotal)}</Text>
          </View>
        </View>

        {data.paymentStages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Schedule</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.cellDescription}>Stage</Text>
                <Text style={styles.cellQty}>%</Text>
                <Text style={styles.cellAmount}>Amount</Text>
              </View>
              {data.paymentStages.map((s, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.cellDescription}>{s.name}</Text>
                  <Text style={styles.cellQty}>{(s.pct * 100).toFixed(1)}%</Text>
                  <Text style={styles.cellAmount}>{formatINR(s.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          This quotation is system-generated and valid as per the terms stated above. All rates are
          inclusive of the specifications mentioned against each item unless stated otherwise.
        </Text>
      </Page>
    </Document>
  );
}
