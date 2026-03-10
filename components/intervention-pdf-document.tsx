'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { InterventionWithClient, Company } from '@/lib/types'

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
  interventionInfo: {
    textAlign: 'right',
  },
  interventionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  interventionDate: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f4f8',
    color: '#1e3a5f',
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
  descriptionBox: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
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
    width: 200,
    height: 80,
    objectFit: 'contain',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
  },
  signatureInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
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
})

interface InterventionPDFDocumentProps {
  intervention: InterventionWithClient
  company: Company | null
}

export function InterventionPDFDocument({ intervention, company }: InterventionPDFDocumentProps) {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.name || 'Ma Societe'}</Text>
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
          </View>
          <View style={styles.interventionInfo}>
            <Text style={styles.interventionNumber}>{intervention.intervention_number}</Text>
            <Text style={styles.interventionDate}>{formatDate(intervention.date)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>BON D&apos;INTERVENTION</Text>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{intervention.client?.name}</Text>
            <Text style={styles.clientDetail}>
              {intervention.client?.address}
              {intervention.client?.postal_code && `, ${intervention.client?.postal_code}`}
              {intervention.client?.city && ` ${intervention.client?.city}`}
            </Text>
            {intervention.client?.phone && (
              <Text style={styles.clientDetail}>Tel: {intervention.client?.phone}</Text>
            )}
            {intervention.client?.email && (
              <Text style={styles.clientDetail}>{intervention.client?.email}</Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION DE L&apos;INTERVENTION</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{intervention.description}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature du client</Text>
              {intervention.signature_data && (
                <>
                  <Image
                    src={intervention.signature_data}
                    style={styles.signatureImage}
                  />
                  {intervention.signer_name && (
                    <Text style={styles.signatureInfo}>
                      Nom: {intervention.signer_name}
                    </Text>
                  )}
                  {intervention.signed_at && (
                    <Text style={styles.signatureInfo}>
                      Date: {formatDateTime(intervention.signed_at)}
                    </Text>
                  )}
                </>
              )}
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Intervenant</Text>
              <Text style={styles.signatureInfo}>{company?.name || 'Ma Societe'}</Text>
            </View>
          </View>

          {intervention.status === 'signed' && (
            <View style={styles.validationBadge}>
              <Text style={styles.validationText}>
                Intervention validee et signee par le client
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {company?.name || 'Ma Societe'} - Bon d&apos;intervention {intervention.intervention_number} - 
          Document genere par InterSign Pro
        </Text>
      </Page>
    </Document>
  )
}
