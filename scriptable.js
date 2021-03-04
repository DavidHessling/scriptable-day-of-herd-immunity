// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
const rkiApiFürImpfdaten = 'https://rki-vaccination-data.vercel.app/api'
const rkiApiFürInfektionsdaten =
  'https://opendata.arcgis.com/datasets/c2f3c3b935a242169c6bec82e1fa573e_0.geojson?where=AdmUnitId%20%3E%3D%200%20AND%20AdmUnitId%20%3C%3D%200'

const optimistischerGrenzwertHerdenimmunität = 49200000 // 60% der deutschen Bevölkerung
const pessimistischerGrenzwertHerdenimmunität = 65600000 // 80% der deutschen Bevölkerung

const widget = await createWidget()

if (!config.runsInWidget) {
  await widget.presentSmall()
}

Script.setWidget(widget)
Script.complete()

async function createWidget (items) {
  var anzahlTageBisHerdenimmunitätOptimistisch = await getAnzahlTageBisHerdenimmunität(
    optimistischerGrenzwertHerdenimmunität
  )

  var anzahlTageBisHerdenimmunitätPessimistisch = await getAnzahlTageBisHerdenimmunität(
    pessimistischerGrenzwertHerdenimmunität
  )

  var tagXOptimistisch = getTagX(anzahlTageBisHerdenimmunitätOptimistisch)

  var tagXPessimistisch = getTagX(anzahlTageBisHerdenimmunitätPessimistisch)

  return erstelleWidget(tagXOptimistisch, tagXPessimistisch)
}

/**
 * Berechnet auf Basis von tageaktuellen Daten die Anzahl der Tage bis eine Herdenimmunität erreicht ist
 * @param {*} grenzeHerdenimmunität Entweder optimistischer (60%) oder pessimistischer (80%) Grenzwert
 */
async function getAnzahlTageBisHerdenimmunität (grenzeHerdenimmunität) {
  const impfdaten = await getImpfdaten()
  const infektionsdaten = await getInfektionsdaten()

  var anzahlNeuerErstimpfungen =
    impfdaten.difference_to_the_previous_day -
    impfdaten['2nd_vaccination'].difference_to_the_previous_day

  var anzahlGesamterImpfungen = impfdaten.vaccinated

  var anzahlNeuerFälle = infektionsdaten.AnzFallNeu
  var anzahlGesamterFälle = infektionsdaten.AnzFall

  var anzahlNichtImmuner =
    grenzeHerdenimmunität - anzahlGesamterFälle - anzahlGesamterImpfungen

  var anzahlTageBisHerdenimmunität =
    anzahlNichtImmuner / (anzahlNeuerErstimpfungen + anzahlNeuerFälle)

  return anzahlTageBisHerdenimmunität
}

/**
 * Erstellt ein Datum das x Tage von heute entfernt ist.
 * @param {*} tageBisHerdenimmunität Anzahl Tage bis Herdenimmunität
 */

function getTagX (tageBisHerdenimmunität) {
  var heute = new Date()
  heute.setDate(heute.getDate() + tageBisHerdenimmunität)
  return heute
}

/**
 * Erstellen und stylen des Widgets
 * @param {*} tagXOptimistisch Stichtag für Herdenimmunität im optimistischen Szenario
 * @param {*} tagXPessimistisch Stichtag für Herdenimmunität im pessimistischen Szenario
 */
function erstelleWidget (tagXOptimistisch, tagXPessimistisch) {
  const list = new ListWidget()
  list.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000)

  const header = list.addText('🦠Tag der Herdenimmunität'.toUpperCase())
  header.font = Font.mediumSystemFont(10)

  list.addSpacer()

  const labelOpt = list.addText(
    'Bis 60%: ' + tagXOptimistisch.toLocaleDateString()
  )
  labelOpt.textColor = Color.green()
  labelOpt.font = Font.mediumSystemFont(13)

  list.addSpacer()

  const labelPes = list.addText(
    'Bis 80%: ' + tagXPessimistisch.toLocaleDateString()
  )
  labelPes.textColor = Color.red()
  labelPes.font = Font.mediumSystemFont(13)

  return list
}

/**
 * Lädt tagesaktuelle Impfdaten vom RKI
 */
async function getImpfdaten () {
  try {
    return await new Request(rkiApiFürImpfdaten).loadJSON()
  } catch (e) {
    throw new Error('Could not retrieve data from RKI API.')
  }
}

/**
 * Lädt tagesaktuelle Infektionsdaten vom RKI
 */
async function getInfektionsdaten () {
  try {
    var data = await new Request(rkiApiFürInfektionsdaten).loadJSON()
    return data.features[0].properties
  } catch (e) {
    throw new Error('Could not retrieve data from RKI API.')
  }
}
