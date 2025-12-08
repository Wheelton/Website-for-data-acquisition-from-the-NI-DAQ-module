# Website for Data Acquisition from the NI DAQ Module

## 🇬🇧 English

### Overview
A web-based control dashboard for data acquisition from National Instruments DAQ modules. This application provides an intuitive interface for configuring and controlling electrical circuit measurements (RL, RC, RLC), real-time data visualization, and result export capabilities.

**Key Features:**
- 🔌 Support for multiple circuit configurations (RL, RC, RLC)
- 📊 Real-time data acquisition and visualization
- ⚡ Configurable measurement parameters (sample rate, buffer size, measurement time)
- 🎛️ Relay control for circuit component switching
- 💾 Export results to JSON and CSV formats
- 🌐 Bilingual interface (English/Polish)
- 📐 Interactive circuit schematics

### System Requirements
- **Python:** 3.8 or higher
- **NI-DAQmx:** Driver software from National Instruments
- **Hardware:** Compatible NI DAQ device (e.g., NI USB-6001, NI USB-6008, NI USB-6009)
- **Operating System:** Windows (recommended for NI-DAQmx support)

### Installation

#### 1. Install NI-DAQmx Driver
Download and install NI-DAQmx driver from the [National Instruments website](https://www.ni.com/en/support/downloads/drivers/download.ni-daqmx.html) or install NI MAX (Measurement & Automation Explorer).

#### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/Website-for-data-acquisition-from-the-NI-DAQ-module.git
cd Website-for-data-acquisition-from-the-NI-DAQ-module
```

#### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Run the Application
```bash
python run.py
```

The application will start on `http://localhost:8000`

### Usage
1. Open your web browser and navigate to `http://localhost:8000/dashboard`
2. Select the desired circuit type (RL, RC, or RLC)
3. Choose component parameters from the available options
4. Configure measurement settings (sample rate, buffer size, measurement time)
5. Click "Start Measurement" to begin data acquisition
6. View data in the charts upon the measurement is done
7. Save results to JSON or CSV format as needed

---

## 🇵🇱 Polski

### Przegląd
Webowa aplikacja do akwizycji danych z modułów DAQ firmy National Instruments. Aplikacja zapewnia intuicyjny interfejs do konfigurowania i kontrolowania pomiarów obwodów elektrycznych (RL, RC, RLC), wizualizacji danych w czasie rzeczywistym oraz eksportu wyników.

**Główne funkcje:**
- 🔌 Obsługa wielu konfiguracji obwodów (RL, RC, RLC)
- 📊 Akwizycja i wizualizacja danych w czasie rzeczywistym
- ⚡ Konfigurowalne parametry pomiaru (częstotliwość próbkowania, rozmiar bufora, czas pomiaru)
- 🎛️ Sterowanie przekaźnikami do przełączania komponentów obwodu
- 💾 Eksport wyników do formatów JSON i CSV
- 🌐 Dwujęzyczny interfejs (angielski/polski)
- 📐 Interaktywne schematy obwodów

### Wymagania systemowe
- **Python:** 3.8 lub wyższy
- **NI-DAQmx:** Oprogramowanie sterownika od National Instruments
- **Sprzęt:** Kompatybilne urządzenie NI DAQ (np. NI USB-6001, NI USB-6008, NI USB-6009)
- **System operacyjny:** Windows (zalecany dla obsługi NI-DAQmx)

### Instalacja

#### 1. Instalacja sterownika NI-DAQmx
Pobierz i zainstaluj sterownik NI-DAQmx ze [strony National Instruments](https://www.ni.com/en/support/downloads/drivers/download.ni-daqmx.html) lub zainstaluj NI MAX (Measurement & Automation Explorer).

#### 2. Sklonuj repozytorium
```bash
git clone https://github.com/yourusername/Website-for-data-acquisition-from-the-NI-DAQ-module.git
cd Website-for-data-acquisition-from-the-NI-DAQ-module
```

#### 3. Instalacja zależności Python
```bash
pip install -r requirements.txt
```

#### 4. Uruchomienie aplikacji
```bash
python run.py
```

Aplikacja zostanie uruchomiona pod adresem `http://localhost:8000`

### Użytkowanie
1. Otwórz przeglądarkę internetową i przejdź do `http://localhost:8000/dashboard`
2. Wybierz żądany typ obwodu (RL, RC lub RLC)
3. Wybierz parametry komponentów z dostępnych opcji
4. Skonfiguruj ustawienia pomiaru (częstotliwość próbkowania, rozmiar bufora, czas pomiaru)
5. Kliknij "Rozpocznij pomiar", aby rozpocząć akwizycję danych
6. Oglądaj dane na wykresach po ukończeniu pomiaru
7. Zapisz wyniki do formatu JSON lub CSV według potrzeb

---

## 📋 Project Information / Informacje o projekcie

**Author / Autor:** Illia Shcheboruk  
**Institution / Instytucja:** Gdańsk University of Technology / Politechnika Gdańska  
**Faculty / Wydział:** Faculty of Electrical and Control Engineering / Wydział Elektrotechniki i Automatyki  
**Project Type / Typ projektu:** Bachelor's Engineering Thesis / Praca Inżynierska  
**Version / Wersja:** 1.0.1 
**Year / Rok:** 2024-2025

---

## 📄 License / Licencja

© 2024-2025 Illia Shcheboruk. All rights reserved. / Wszelkie prawa zastrzeżone.
