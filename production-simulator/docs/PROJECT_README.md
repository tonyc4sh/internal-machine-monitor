# 🏭 ForgeGrid - Production Monitoring & Analytics

> **System monitoringu produkcji z modułem analitycznym**  
> Projekt FailSafe • Hackathon dla Małopolski 2025 • ELPLC S.A.

---

## 🎯 Co Robi ForgeGrid?

**ForgeGrid** to zaawansowany system monitorowania hali produkcyjnej z pełnym modułem raportowania:

### 🏭 Production Monitoring
- ✅ **8 maszyn produkcyjnych** - 5x CNC, 2x Assembly, 1x Test
- ✅ **16 typów zadań** - wariatory, baterie e-bike, amortyzatory, testy EOL, kalibracja
- ✅ **Ciągły napływ zleceń** - nowe zadania co 5-15 sekund produkcyjnych
- ✅ **Inteligentny przydział** - algorytm MCT-S (Minimum Completion Time with Setup)
- ✅ **Symulacja awarii** - breakdown z automatyczną dystrybucją zadań
- ✅ **Priorytety** - Critical (🔴) / Rush (🟡) / Normal (🟢)

### 📊 Analytics & Reporting
- ✅ **Real-time KPIs** - throughput, hall load, task counts
- ✅ **3 interaktywne wykresy** - Hall Load, Task Throughput, Machine Utilization
- ✅ **Event logging** - 8 typów zdarzeń z timestampami i severity levels
- ✅ **Alert routing** - notyfikacje dla Technicians/Supervisors/Managers/QC
- ✅ **Eksport CSV** - pełna historia zdarzeń do analizy
- ✅ **Time range filtering** - 5m / 15m / 30m / 1h

### 🎨 Professional UI
- ✅ **Production View** - dashboard w stylu MES z 8 maszynami
- ✅ **Analytics View** - kompletny moduł raportowania
- ✅ **Brutalist design** - cyan accents, slate backgrounds, uppercase mono labels
- ✅ **Real-time updates** - aktualizacja co 0.5 minuty produkcyjnej

---

## 🚀 Quick Start

### Instalacja i uruchomienie

```powershell
# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev
```

Aplikacja uruchomi się pod adresem **http://localhost:5173**

---

## 🎮 Jak używać

### Kontrola systemu

- **▶️ START** - Uruchamia system (przypisuje wszystkie zadania)
- **⏸️ PAUSE** - Wstrzymuje system
- **🔄 RESET** - Resetuje system (nowa pula 15-25 zadań)

### Jak działa system?

1. **Przy starcie**: System generuje 15-25 losowych zleceń i przypisuje je do maszyn
2. **Co 5-15 sekund**: Pojawiają się nowe zlecenia (ciągły napływ)
3. **Automatyczny przydział**: Nowe zadania są natychmiast przypisywane algorytmem
4. **Realizacja**: Maszyny przetwarzają kolejkę, paski postępu aktualizują się płynnie

**Prędkość systemu**: 2 minuty produkcyjne = 1 sekunda czasu rzeczywistego

---

## 📊 Jakie Wartości Śledzi System?

### Metryki Globalne (Production View)
- **Hall Load** - średnie obciążenie wszystkich maszyn (0-100%)
- **ETA** - szacowany czas zakończenia wszystkich zadań w minutach
- **Completed** - suma ukończonych zadań od startu systemu
- **In Progress** - liczba zadań aktualnie przetwarzanych
- **Waiting** - zadania czekające w Task Pool na przydział
- **Throughput** - przepustowość systemu (zadania/godzinę)

### Metryki Maszynowe (dla każdej z 8 maszyn)
- **Current Task Progress** - postęp aktualnego zadania (0-100%)
- **Queue ETA** - suma czasów wszystkich zadań w kolejce (minuty)
- **Utilization** - wykorzystanie maszyny od startu systemu (%)
- **Completed Tasks** - liczba ukończonych zadań
- **Status** - idle / processing / maintenance / breakdown

### Analytics View - KPI Cards
- **Throughput** - zadania/hr (⚡)
- **Completed** - suma ukończonych (✓)
- **In Progress** - aktywne zadania (⚙️)
- **Waiting** - w kolejce (📋)
- **Events Logged** - suma wszystkich zdarzeń (📝)

### Analytics View - Wykresy
1. **Hall Load Trend** (Area Chart)
   - Oś X: Production Time (minuty)
   - Oś Y: Hall Load (0-100%)
   - Time Range: 5m / 15m / 30m / 1h

2. **Task Throughput** (Multi-Line Chart)
   - 3 linie: Completed (zielona) / Active (pomarańczowa) / Waiting (szara)
   - Oś X: Production Time
   - Oś Y: Task Count

3. **Machine Utilization Distribution** (Bar Chart)
   - 8 słupków: CNC (x5), Assembly (x2), Test (x1)
   - Oś Y: Utilization % (0-100%)

### Event Log - Typy Zdarzeń
- **task_created** - nowe zadanie wygenerowane
- **task_assigned** - zadanie przydzielone do maszyny
- **task_started** - rozpoczęcie przetwarzania
- **task_completed** - ukończenie zadania
- **machine_breakdown** - awaria maszyny
- **machine_repaired** - naprawa maszyny
- **alert_sent** - wysłanie alertu do operatorów
- **rebalance_triggered** - redistrybucja zadań

### Notification Recipients (Alert Routing)
- **Technicians** (🔧) - alerty techniczne, awarie
- **Supervisors** (👔) - priorytety, delays
- **Managers** (💼) - raporty wydajności
- **Quality Control** (🔬) - problemy jakościowe

---

## 📦 Typy Zleceń (Produkty ELPLC)

System zawiera **16 realistycznych typów zadań** inspirowanych produktami ELPLC:

- Wariator - Obróbka (Critical, 25 min)
- Bateria E-Bike - Montaż (Rush, 40 min)
- Amortyzator - Spawanie (Normal, 35 min)
- Inwenter - Sterownik (Critical, 50 min)
- Test EOL - Rozszerzony/Krótki (60/15 min)
- Kalibracja - Czujniki (45 min)
- + więcej

---

## 🤖 Algorytm Przydziału

System używa **algorytmu MCT-S (Minimum Completion Time with Setup)**:

```
DLA KAŻDEGO NOWEGO ZADANIA:
1. Znajdź maszyny preferowane przez zadanie
2. Oblicz ETA dla każdej maszyny (uwzględniając Setup Time)
3. Wybierz maszynę z najmniejszym ETA
4. Work Stealing: Wolne maszyny mogą przejmować zadania od przeciążonych
```

**To NIE jest losowy przydział** - to zaawansowany model planowania.

---

## 📈 Stack Technologiczny

- **React 19 + TypeScript** - Komponenty i typowanie
- **Vite** - Dev server (ultra szybki)
- **Tailwind CSS** - Profesjonalny dark theme
- **Framer Motion** - Płynne animacje
- **Zustand** - State management

---

## 🧮 Realistyczne Parametry

### Koszt przestoju (validowane z ELPLC)

```
Wariatory: $120/szt, 6 sek cykl = 600 szt/h
KOSZT PRZESTOJU: $72,000 NA GODZINĘ! ⚠️

Awaria 30 min = $36,000 strat
FailSafe (2 min) = $2,400 strat
Oszczędność: $33,600 (93%)
```

---

<div align="center">
  <h3>🏭 FailSafe Production Monitor</h3>
  <p><i>"Zero paniki. 3 sekundy. Nowy plan."</i></p>
  <p>Built with ❤️ for ELPLC by Team FailSafe</p>
</div>
