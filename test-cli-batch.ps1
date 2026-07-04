# Fontanin CLI - Automated Batch Test Runner
# Accenture Functional QA Suite v1.0.0

# Codici Colori ANSI per reportistica
$ESC = [char]27
$ClrReset = "$ESC[0m"
$ClrOro   = "$ESC[38;5;220m"
$ClrCyan  = "$ESC[38;5;51m"
$ClrGreen = "$ESC[38;5;46m"
$ClrRed   = "$ESC[38;5;196m"
$ClrWhite = "$ESC[38;5;15m"
$ClrGray  = "$ESC[38;5;244m"

$BackendUrl = "https://finedimondo-backend-vqytacm7la-ew.a.run.app/community"
$global:TestReport = @()
$global:PassedCount = 0
$global:FailedCount = 0

function Add-TestResult($id, $category, $desc, $status, $details) {
    $global:TestReport += [PSCustomObject]@{
        TestID      = $id
        Category    = $category
        Description = $desc
        Status      = $status
        Details     = $details
    }
    if ($status -eq "PASSED") {
        $global:PassedCount++
    } else {
        $global:FailedCount++
    }
}

Write-Host "$ClrOro"
Write-Host "=========================================================="
Write-Host "  ACCENTURE AUTOMATED BATCH TEST SUITE - EL FONTANIN CLI  "
Write-Host "=========================================================="
Write-Host "$ClrReset"

# -----------------------------------------------------------------------------
# TC-001: Verifica Contenuti Info & Storia
# -----------------------------------------------------------------------------
Write-Host "$ClrCyan[RUNNING] TC-001: Verifica Contenuti Info & Storia...$ClrReset"
try {
    # Leggi il file della CLI per verificare che contenga le stringhe corrette della storia
    $cliContent = Get-Content -Path "fontanin-cli.ps1" -Raw
    if ($cliContent -match "1682" -and $cliContent -match "Fine di Mondo APS" -and $cliContent -match "sorgiva storica") {
        Add-TestResult "TC-001" "Static Assets" "History & Governance Info" "PASSED" "Parole chiave storiche (1682, Fine di Mondo, sorgiva) verificate nel codice."
    } else {
        Add-TestResult "TC-001" "Static Assets" "History & Governance Info" "FAILED" "Mancano parole chiave fondamentali nel codice della CLI."
    }
} catch {
    Add-TestResult "TC-001" "Static Assets" "History & Governance Info" "FAILED" "Errore lettura file: $($_.Exception.Message)"
}

# -----------------------------------------------------------------------------
# TC-002: Verifica Landmark della Mappa ASCII
# -----------------------------------------------------------------------------
Write-Host "$ClrCyan[RUNNING] TC-002: Verifica Landmark della Mappa ASCII...$ClrReset"
try {
    if ($cliContent -match "\[X\]" -and $cliContent -match "\[O\]" -and $cliContent -match "\[WWF\]" -and $cliContent -match "\[#\]") {
        Add-TestResult "TC-002" "Static Assets" "ASCII Map Landmarks" "PASSED" "Tutti e quattro i landmark geografici ([X], [O], [WWF], [#]) sono mappati nella CLI."
    } else {
        Add-TestResult "TC-002" "Static Assets" "ASCII Map Landmarks" "FAILED" "Uno o più landmark geografici non sono presenti nel codice della mappa."
    }
} catch {
    Add-TestResult "TC-002" "Static Assets" "ASCII Map Landmarks" "FAILED" "Errore analisi mappa: $($_.Exception.Message)"
}

# -----------------------------------------------------------------------------
# TC-003: Verifica Connettività API Cloud Run (Health Check)
# -----------------------------------------------------------------------------
Write-Host "$ClrCyan[RUNNING] TC-003: Verifica Connettività API Cloud Run...$ClrReset"
try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -TimeoutSec 8
    $endTime = Get-Date
    $latency = [Math]::Round(($endTime - $startTime).TotalMilliseconds)
    
    if ($response.status -eq "ok" -and $response.module -eq "community") {
        Add-TestResult "TC-003" "Integration" "Cloud Run API Health Check" "PASSED" "Backend raggiungibile (status: ok, modulo: community). Latenza: $latency ms."
    } else {
        Add-TestResult "TC-003" "Integration" "Cloud Run API Health Check" "FAILED" "Risposta del backend non conforme: $(ConvertTo-Json $response -Compress)"
    }
} catch {
    Add-TestResult "TC-003" "Integration" "Cloud Run API Health Check" "FAILED" "Impossibile connettersi al backend: $($_.Exception.Message)"
}

# -----------------------------------------------------------------------------
# TC-004: Verifica Derivazione Wallet Algorand MPC e Firma
# -----------------------------------------------------------------------------
Write-Host "$ClrCyan[RUNNING] TC-004: Verifica Derivazione Wallet Algorand MPC e Firma...$ClrReset"
try {
    # Esegui lo script Node.js che verifica in maniera deterministica la crittografia di algosdk e tweetnacl
    $testNode = node verify_algorand_mpc.js
    if ($testNode -match "TEST SUPERATO CON SUCCESSO") {
        Add-TestResult "TC-004" "Cryptography" "Algorand Wallet Derivation & Sign" "PASSED" "Derivazione deterministica da seed e firma ed25519 verificate con algosdk."
    } else {
        Add-TestResult "TC-004" "Cryptography" "Algorand Wallet Derivation & Sign" "FAILED" "Il test crittografico Node.js non ha riportato successo. Output: $testNode"
    }
} catch {
    Add-TestResult "TC-004" "Cryptography" "Algorand Wallet Derivation & Sign" "FAILED" "Errore esecuzione script crittografico: $($_.Exception.Message)"
}

# -----------------------------------------------------------------------------
# Stampa Report Finale
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=========================================================="
Write-Host "                     TEST SUITE REPORT                    "
Write-Host "=========================================================="
Write-Host ""

foreach ($r in $global:TestReport) {
    $statusColor = if ($r.Status -eq "PASSED") { $ClrGreen } else { $ClrRed }
    Write-Host "$($r.TestID) | $($r.Category) - $($r.Description)"
    Write-Host "Status: $statusColor$($r.Status)$ClrReset"
    Write-Host "Details: $($r.Details)"
    Write-Host "$ClrGray----------------------------------------------------------$ClrReset"
}

$summaryColor = if ($global:FailedCount -eq 0) { $ClrGreen } else { $ClrRed }
Write-Host ""
Write-Host "Statistiche di Esecuzione:"
Write-Host " - Test Eseguiti: $($global:PassedCount + $global:FailedCount)"
Write-Host " - Passati: $ClrGreen$global:PassedCount$ClrReset"
Write-Host " - Falliti: $summaryColor$global:FailedCount$ClrReset"
Write-Host ""

if ($global:FailedCount -eq 0) {
    Write-Host "$ClrGreen>>> ESITO GENERALE: SUCCESS (Tutti i test funzionali superati) <<<$ClrReset"
} else {
    Write-Host "$ClrRed>>> ESITO GENERALE: FAILURE (Rilevati errori di validazione) <<<$ClrReset"
    exit 1
}
Write-Host ""
