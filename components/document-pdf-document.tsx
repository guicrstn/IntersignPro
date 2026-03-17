'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { DocumentWithDetails, Company, DocumentType } from '@/lib/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  companyInfo: {
    flex: 1,
  },
  companyLogo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  documentInfo: {
    textAlign: 'right',
  },
  documentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#1e3a5f',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e3a5f',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  clientBox: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  // Table styles
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    padding: 8,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f8f9fa',
  },
  colRef: {
    width: '10%',
  },
  colDescription: {
    width: '30%',
  },
  colQty: {
    width: '10%',
    textAlign: 'right',
  },
  colUnit: {
    width: '10%',
    textAlign: 'center',
  },
  colPriceHT: {
    width: '12%',
    textAlign: 'right',
  },
  colTVA: {
    width: '8%',
    textAlign: 'right',
  },
  colTotalHT: {
    width: '10%',
    textAlign: 'right',
  },
  colTotalTTC: {
    width: '10%',
    textAlign: 'right',
  },
  tableText: {
    fontSize: 8,
  },
  tableTextBold: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Totals
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalLabelFinal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalAmountFinal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  // TVA breakdown
  tvaBreakdown: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },
  tvaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tvaText: {
    fontSize: 8,
    color: '#666',
  },
  // Notes
  notesBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  // Terms
  termsBox: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 8,
    color: '#666',
    lineHeight: 1.4,
  },
  // Signature
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e3a5f',
  },
  signatureImage: {
    width: 150,
    height: 60,
    objectFit: 'contain',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
  },
  signatureInfo: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
  },
  signaturePlaceholder: {
    width: 150,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  // Validation
  validationBadge: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#d4edda',
    borderRadius: 4,
  },
  validationText: {
    fontSize: 10,
    color: '#155724',
    textAlign: 'center',
  },
  // Validity
  validityInfo: {
    marginTop: 10,
    fontSize: 9,
    color: '#666',
  },
  // Paid stamp for invoices
  paidStampContainer: {
    position: 'absolute',
    top: 200,
    right: 40,
    transform: 'rotate(-15deg)',
  },
  paidStamp: {
    padding: '15px 25px',
    borderWidth: 4,
    borderColor: '#22c55e',
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  paidText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
    textAlign: 'center',
  },
  paidDate: {
    fontSize: 10,
    color: '#22c55e',
    textAlign: 'center',
    marginTop: 4,
  },
  // Delivery info
  deliveryInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
  },
  deliveryText: {
    fontSize: 9,
    color: '#0369a1',
  },
  // Order confirmation
  orderConfirmation: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  orderText: {
    fontSize: 9,
    color: '#92400e',
  },
})

const DOCUMENT_TITLES: Record<DocumentType, string> = {
  devis: 'DEVIS',
  commande: 'BON DE COMMANDE',
  livraison: 'BON DE LIVRAISON',
  facture: 'FACTURE',
}

interface DocumentPDFDocumentProps {
  document: DocumentWithDetails
  company: Company | null
}

export function DocumentPDFDocument({ document, company }: DocumentPDFDocumentProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {company?.logo_url ? (
              <Image src={company.logo_url} style={styles.companyLogo} />
            ) : (
              <Text style={styles.companyName}>{company?.name || 'Ma Societe'}</Text>
            )}
            {company?.address && (
              <Text style={styles.companyDetail}>
                {company.address}
                {company.postal_code && `, ${company.postal_code}`}
                {company.city && ` ${company.city}`}
              </Text>
            )}
            {company?.phone && (
              <Text style={styles.companyDetail}>Tel: {company.phone}</Text>
            )}
            {company?.email && (
              <Text style={styles.companyDetail}>{company.email}</Text>
            )}
            {company?.siret && (
              <Text style={styles.companyDetail}>SIRET: {company.siret}</Text>
            )}
            {company?.tva_number && (
              <Text style={styles.companyDetail}>TVA: {company.tva_number}</Text>
            )}
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentNumber}>{document.document_number}</Text>
            <Text style={styles.documentDate}>{formatDate(document.document_date)}</Text>
            {document.validity_date && document.document_type === 'devis' && (
              <Text style={styles.validityInfo}>
                Valable jusqu'au {new Date(document.validity_date).toLocaleDateString('fr-FR')}
              </Text>
            )}
            {document.due_date && document.document_type === 'facture' && (
              <Text style={styles.validityInfo}>
                Echeance: {new Date(document.due_date).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{DOCUMENT_TITLES[document.document_type]}</Text>

        {/* Paid Stamp for invoices */}
        {document.document_type === 'facture' && document.payment_status === 'paid' && (
          <View style={styles.paidStampContainer}>
            <View style={styles.paidStamp}>
              <Text style={styles.paidText}>PAYE</Text>
              <Text style={styles.paidDate}>
                {new Date().toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{document.client?.name}</Text>
            <Text style={styles.clientDetail}>
              {document.client?.address}
              {document.client?.postal_code && `, ${document.client?.postal_code}`}
              {document.client?.city && ` ${document.client?.city}`}
            </Text>
            {document.client?.phone && (
              <Text style={styles.clientDetail}>Tel: {document.client?.phone}</Text>
            )}
            {document.client?.email && (
              <Text style={styles.clientDetail}>{document.client?.email}</Text>
            )}
            {document.client?.client_type === 'professionnel' && document.client?.siret && (
              <Text style={styles.clientDetail}>SIRET: {document.client.siret}</Text>
            )}
            {document.client?.client_type === 'professionnel' && document.client?.tva_number && (
              <Text style={styles.clientDetail}>N° TVA: {document.client.tva_number}</Text>
            )}
          </View>
        </View>

        {/* Subject */}
        {document.subject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBJET</Text>
            <Text style={styles.notesText}>{document.subject}</Text>
          </View>
        )}

        {/* Lines Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETAIL</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colRef}>
                <Text style={styles.tableHeaderText}>Ref.</Text>
              </View>
              <View style={styles.colDescription}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableHeaderText}>Qte</Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={styles.tableHeaderText}>Unite</Text>
              </View>
              <View style={styles.colPriceHT}>
                <Text style={styles.tableHeaderText}>P.U. HT</Text>
              </View>
              <View style={styles.colTVA}>
                <Text style={styles.tableHeaderText}>TVA</Text>
              </View>
              <View style={styles.colTotalHT}>
                <Text style={styles.tableHeaderText}>Total HT</Text>
              </View>
              <View style={styles.colTotalTTC}>
                <Text style={styles.tableHeaderText}>Total TTC</Text>
              </View>
            </View>
            {/* Table Rows */}
            {document.lines?.map((line, index) => (
              <View key={line.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colRef}>
                  <Text style={styles.tableText}>{line.reference || '-'}</Text>
                </View>
                <View style={styles.colDescription}>
                  <Text style={styles.tableTextBold}>{line.description}</Text>
                  <Text style={styles.tableText}>{line.line_type === 'service' ? 'Prestation' : 'Materiel'}</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.tableText}>{line.quantity}</Text>
                </View>
                <View style={styles.colUnit}>
                  <Text style={styles.tableText}>{line.unit}</Text>
                </View>
                <View style={styles.colPriceHT}>
                  <Text style={styles.tableText}>{formatCurrency(line.unit_price_ht)}</Text>
                </View>
                <View style={styles.colTVA}>
                  <Text style={styles.tableText}>{line.tva_rate}%</Text>
                </View>
                <View style={styles.colTotalHT}>
                  <Text style={styles.tableText}>{formatCurrency(line.total_ht)}</Text>
                </View>
                <View style={styles.colTotalTTC}>
                  <Text style={styles.tableText}>{formatCurrency(line.total_ttc)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        {document.totals && (
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalAmount}>{formatCurrency(document.totals.total_ht)}</Text>
            </View>
            {document.totals.total_discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={styles.totalAmount}>-{formatCurrency(document.totals.total_discount)}</Text>
              </View>
            )}
            {/* TVA breakdown */}
            {document.totals.tva_20 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA 20%</Text>
                <Text style={styles.totalAmount}>{formatCurrency(document.totals.tva_20)}</Text>
              </View>
            )}
            {document.totals.tva_10 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA 10%</Text>
                <Text style={styles.totalAmount}>{formatCurrency(document.totals.tva_10)}</Text>
              </View>
            )}
            {document.totals.tva_5_5 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA 5,5%</Text>
                <Text style={styles.totalAmount}>{formatCurrency(document.totals.tva_5_5)}</Text>
              </View>
            )}
            {document.totals.tva_2_1 > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA 2,1%</Text>
                <Text style={styles.totalAmount}>{formatCurrency(document.totals.tva_2_1)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total TVA</Text>
              <Text style={styles.totalAmount}>{formatCurrency(document.totals.total_tva)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL TTC</Text>
              <Text style={styles.totalAmountFinal}>{formatCurrency(document.totals.total_ttc)}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {document.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {document.terms && (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Conditions</Text>
            <Text style={styles.termsText}>{document.terms}</Text>
          </View>
        )}

        {/* Document-specific information */}
        {document.document_type === 'commande' && (
          <View style={styles.orderConfirmation}>
            <Text style={styles.orderText}>
              En signant ce bon de commande, le client confirme son accord sur les produits/prestations 
              ci-dessus et s'engage a en regler le montant selon les conditions convenues.
            </Text>
          </View>
        )}

        {document.document_type === 'livraison' && (
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryText}>
              En signant ce bon de livraison, le client confirme avoir recu le(s) materiel(s) 
              ci-dessus en bon etat et conforme(s) a la commande.
            </Text>
          </View>
        )}

        {document.document_type === 'facture' && (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Mentions legales</Text>
            <Text style={styles.termsText}>
              En cas de retard de paiement, une penalite de 3 fois le taux d'interet legal sera appliquee, 
              ainsi qu'une indemnite forfaitaire de 40€ pour frais de recouvrement.
              {document.payment_status === 'paid' ? ' Cette facture a ete reglee.' : ''}
            </Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Bon pour accord - Signature client</Text>
              {document.signature_data ? (
                <>
                  <Image
                    src={document.signature_data}
                    style={styles.signatureImage}
                  />
                  {document.signer_name && (
                    <Text style={styles.signatureInfo}>
                      Nom: {document.signer_name}
                    </Text>
                  )}
                  {document.signed_at && (
                    <Text style={styles.signatureInfo}>
                      Date: {formatDateTime(document.signed_at)}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.signaturePlaceholder} />
              )}
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>{company?.name || 'Ma Societe'}</Text>
              <Text style={styles.signatureInfo}>Le prestataire</Text>
            </View>
          </View>

          {document.status === 'signed' && (
            <View style={styles.validationBadge}>
              <Text style={styles.validationText}>
                Document signe et approuve par le client
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {company?.name || 'Ma Societe'} - {DOCUMENT_TITLES[document.document_type]} {document.document_number} - 
          Document genere par InterSign Pro
        </Text>
      </Page>
    </Document>
  )
}
