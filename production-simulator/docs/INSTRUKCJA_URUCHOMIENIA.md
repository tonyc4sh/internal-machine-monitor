# 🚀 Instrukcja Uruchomienia - ELPLC Production Simulator

## Quick Start (Windows PowerShell)

### 1. Przejdź do katalogu projektu
```powershell
cd internal-machine-monitor/production-simulator
```

### 2. Zainstaluj zależności (jeśli jeszcze nie zrobione)
```powershell
npm install
```

### 3. Uruchom serwer deweloperski
```powershell
npm run dev
```

### 4. Otwórz przeglądarkę
```
http://localhost:5173
```

---

## 🎮 Jak korzystać z symulatora

### Po otwarciu aplikacji:

1. **Kliknij START** (▶️) - system automatycznie:
   - Wygeneruje 15-25 losowych zleceń
   - Przypisze je do odpowiednich maszyn według algorytmu
   - Rozpocznie symulację produkcji

2. **Obserwuj symulację**:
   - **Górny pasek** - globalne metryki hali (obciążenie, ETA, throughput)
   - **Lewy panel** - pula oczekujących zleceń
   - **Cztery kolumny** - maszyny z aktywnym zadaniem i kolejką
   - Paski postępu aktualizują się w czasie rzeczywistym
   - Co 5-15 sekund pojawiają się nowe zlecenia

3. **Kontrola**:
   - **PAUSE** (⏸️) - zatrzymaj symulację
   - **RESET** (🔄) - zacznij od nowa z nowymi zadaniami

---

## 🎯 Co pokazuje demo?

### Realistyczny scenariusz hali ELPLC:

**8 Maszyn:**
- **CNC-01 do CNC-05** - Szybkie frezarki (obróbka precyzyjna)
- **Assembly-Line A & B** - Linie montażowe (spawanie, złożenia)
- **Test-Stand B** - Stanowisko testowe (EOL, kalibracja)

**16 Typów Zleceń:**
- Wariatory (Critical - automotive deadline!)
- Baterie E-Bike (Rush)
- Amortyzatory (Normal)
- Testy EOL, Kalibracja, Pakowanie...

**Inteligentny Przydział:**
- System automatycznie wybiera najlepszą maszynę dla każdego zadania
- Uwzględnia preferencje typu maszyny i priorytety
- Minimalizuje czas zakończenia całej produkcji (makespan)
- Obsługuje Work Stealing (podkradanie zadań)

---

## 💡 Kluczowe Wskaźniki

### Globalne (górny pasek):
- **Obciążenie hali** - % zajętych maszyn
- **ETA hali** - Czas zakończenia wszystkich zadań
- **Ukończone / W realizacji / Oczekujące** - Status zadań
- **Throughput** - Produktywność (zadania/godz)

### Per maszyna (kolumny):
- **Wydajność** - Mnożnik czasu (100% = normalny)
- **Kolejka** - Liczba oczekujących zadań
- **ETA** - Czas zakończenia kolejki (minuty)
- **Wykorzystanie** - % czasu pracy od startu

---

## 🔧 Rozwiązywanie problemów

### Aplikacja nie uruchamia się?
```powershell
# Usuń node_modules i package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Zainstaluj ponownie
npm install
npm run dev
```

### Port 5173 zajęty?
```powershell
# Zabij proces na porcie 5173
Stop-Process -Name node -Force
```

### Błędy TypeScript?
```powershell
# Sprawdź kompilację
npx tsc --noEmit
```

---

## 📊 Demo dla Jury Hackathonu

### 3-minutowy scenariusz prezentacji:

1. **[0:00-0:30]** Otwarcie aplikacji, pokazanie interfejsu
   - "To jest symulator 8 maszyn produkcyjnych z hal ELPLC"

2. **[0:30-1:00]** Kliknięcie START
   - "System generuje 20 zleceń i przypisuje je automatycznie"
   - Pokazanie algorytmu w akcji

3. **[1:00-2:00]** Obserwacja symulacji
   - "CNC-01 do CNC-05 przetwarzają wariatory (Critical priority)"
   - "Assembly-A/B montuje baterie e-bike"
   - "Test-B wykonuje testy EOL"
   - Pokazanie metryk: obciążenie 75%, ETA 120 minut

4. **[2:00-2:30]** Nowe zlecenia pojawiają się dynamicznie
   - "Co kilka sekund napływają nowe zamówienia"
   - "System automatycznie je przydziela"

5. **[2:30-3:00]** Podsumowanie
   - "To nie losowa symulacja - to model planera produkcji"
   - "Dane validowane z lead produkcji ELPLC"
   - "Koszt przestoju: $72k/h (wariatory automotive)"

---

## 🎓 Techniczne szczegóły dla ciekawskich

### Algorytm przydziału zadań:
```
Dla każdego zadania:
1. Znajdź maszyny preferowane (CNC dla obróbki, Assembly dla montażu)
2. Oblicz ETA = czas_pozostały + kolejka + nowe_zadanie + setup_time
3. Wybierz maszynę z najmniejszym ETA
4. Work Stealing: Wolne maszyny mogą przejmować zadania
```

### Prędkość symulacji:
- 2 minuty produkcyjne = 1 sekunda rzeczywista
- Update co 300ms
- Płynne animacje Framer Motion

### Stack:
- React 19 + TypeScript
- Zustand (state management)
- Tailwind CSS (dark theme)
- Vite (build tool)

---

<div align="center">
  <h3>✅ Wszystko gotowe!</h3>
  <p><i>Otwórz http://localhost:5173 i kliknij START</i></p>
  <p>🏭 FailSafe - System reagujący na awarie</p>
</div>
