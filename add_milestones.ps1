
$jsonPath = ".\data.json"
$jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json

$newActivities = @()
$milestoneCounter = 1

foreach ($activity in $jsonContent.actividades) {
    # Add the current activity
    $newActivities += $activity

    # If it's a Stage (starts with "ETAPA")
    if ($activity.nombre -like "ETAPA*") {
        $stageNumber = $activity.id
        
        # Check if the next activity in the original list is already a milestone
        # This is a bit tricky since we are iterating. 
        # Instead, let's just check if we need to insert a milestone for this stage.
        
        # We know H1 follows Stage 1, H2 follows Stage 2.
        # We need milestones for Stage 3, 4, 5, 6.
        # Stage 7 has H3 (Go Live) after it.
        
        # Logic:
        # If Stage ID is 3, 4, 5, 6, insert a milestone.
        
        if ($activity.id -in @("3", "4", "5", "6")) {
            $milestoneId = "H" + $activity.id
            $milestoneName = "HITO: Fin de " + ($activity.nombre -replace "ETAPA \d+: ", "")
            
            $milestone = [PSCustomObject]@{
                id          = $milestoneId
                nombre      = $milestoneName
                fechaInicio = $activity.fechaFin
                fechaFin    = $activity.fechaFin
                tipo        = "hito"
                progreso    = 0
                color       = "#E91E63" # Pink color for milestones
                descripcion = "Hito de finalización de la etapa " + $activity.id
                rol         = "Project Manager"
            }
            $newActivities += $milestone
        }
    }
    
    # If it's an existing milestone, we might need to renumber it or keep it.
    # H1 and H2 are fine.
    # H3 (Go Live) is after Stage 7. Let's keep it but maybe rename ID if needed?
    # The user didn't ask to renumber, just "add milestone to each stage".
    # If I add H3 after Stage 3, I will have two H3s if I don't change the old one.
    
    if ($activity.tipo -eq "hito") {
        if ($activity.id -eq "H3") {
            $activity.id = "H7" # Rename old H3 to H7 (Go Live)
        }
    }
}

$jsonContent.actividades = $newActivities
$jsonContent | ConvertTo-Json -Depth 10 | Set-Content ".\data_milestones.json" -Encoding UTF8

# Replace original
Move-Item ".\data_milestones.json" $jsonPath -Force
Write-Host "Milestones added successfully."
