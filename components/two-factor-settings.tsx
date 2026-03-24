'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Image from 'next/image'

type Step = 'idle' | 'setup' | 'verify' | 'backup' | 'disable'

export function TwoFactorSettings() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState<Step>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disableCode, setDisableCode] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa')
      if (response.ok) {
        const data = await response.json()
        setIsEnabled(data.isEnabled)
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startSetup = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCodeDataURL)
        setSecret(data.secret)
        setStep('setup')
      } else {
        toast.error('Erreur lors de la configuration')
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast.error('Erreur lors de la configuration')
    } finally {
      setIsProcessing(false)
    }
  }

  const verifyAndEnable = async () => {
    if (code.length !== 6) {
      toast.error('Entrez un code a 6 chiffres')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', code }),
      })

      const data = await response.json()

      if (data.success) {
        setBackupCodes(data.backupCodes)
        setStep('backup')
        setIsEnabled(true)
        toast.success('2FA active avec succes')
      } else {
        toast.error(data.error || 'Code invalide')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      toast.error('Erreur lors de l\'activation')
    } finally {
      setIsProcessing(false)
    }
  }

  const disable2FA = async () => {
    if (!disableCode) {
      toast.error('Entrez votre code 2FA')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', code: disableCode }),
      })

      const data = await response.json()

      if (data.success) {
        setIsEnabled(false)
        setShowDisableDialog(false)
        setDisableCode('')
        toast.success('2FA desactive')
      } else {
        toast.error(data.error || 'Code invalide')
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast.error('Erreur lors de la desactivation')
    } finally {
      setIsProcessing(false)
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Codes de secours copies')
  }

  const resetState = () => {
    setStep('idle')
    setQrCode(null)
    setSecret(null)
    setCode('')
    setBackupCodes([])
    setShowSecret(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <div className="p-2 bg-green-100 rounded-full">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-muted rounded-full">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle>Authentification a deux facteurs (2FA)</CardTitle>
              <CardDescription>
                Ajoutez une couche de securite supplementaire a votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  L&apos;authentification a deux facteurs est activee
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre compte est protege par une application d&apos;authentification. 
                Vous devrez entrer un code a chaque connexion.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Desactiver le 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protegez votre compte en ajoutant une verification supplementaire 
                lors de la connexion avec une application comme Google Authenticator, 
                Authy ou Microsoft Authenticator.
              </p>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Recommande pour la securite</p>
                  <p>Le 2FA protege votre compte meme si votre mot de passe est compromis.</p>
                </div>
              </div>
              <Button onClick={startSetup} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Configurer le 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={step === 'setup'} onOpenChange={() => step === 'setup' && resetState()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer le 2FA</DialogTitle>
            <DialogDescription>
              Scannez ce QR code avec votre application d&apos;authentification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <Image 
                    src={qrCode} 
                    alt="QR Code 2FA" 
                    width={200} 
                    height={200}
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Ou entrez le code manuellement :</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={showSecret ? secret || '' : '••••••••••••••••'}
                    readOnly
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetState}>Annuler</Button>
            <Button onClick={() => setStep('verify')}>Continuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={step === 'verify'} onOpenChange={() => step === 'verify' && resetState()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifier le code</DialogTitle>
            <DialogDescription>
              Entrez le code a 6 chiffres de votre application d&apos;authentification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code de verification</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep('setup')}>Retour</Button>
            <Button onClick={verifyAndEnable} disabled={isProcessing || code.length !== 6}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activer le 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={step === 'backup'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Codes de secours</DialogTitle>
            <DialogDescription>
              Conservez ces codes dans un endroit sur. Ils vous permettront de vous connecter 
              si vous perdez acces a votre application d&apos;authentification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={copyBackupCodes}>
              <Copy className="mr-2 h-4 w-4" />
              Copier les codes
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Chaque code ne peut etre utilise qu&apos;une seule fois.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={resetState} className="w-full">
              J&apos;ai sauvegarde mes codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactiver le 2FA ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Cela reduira la securite de votre compte. Entrez votre code 2FA 
                ou un code de secours pour confirmer.
              </p>
              <Input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Code 2FA ou code de secours"
                className="mt-4"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={disable2FA}
              disabled={!disableCode || isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
