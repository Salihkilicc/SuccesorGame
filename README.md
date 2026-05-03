# 📈 Successor: Ed-Tech Corporate Finance & Management Simulation

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-brown?style=for-the-badge)
![EdTech](https://img.shields.io/badge/Industry-EdTech_%7C_Simulation-success?style=for-the-badge)

**Successor** is a high-fidelity, procedurally generated educational simulation designed to teach complex corporate finance, macroeconomics, and strategic management through experiential learning. Instead of reading financial theory, users act as executives, navigating real-world business mechanics in a dynamic, AI-driven economy.

---

## 🎓 Educational Value & Core Modules

* **🏢 Corporate Finance Engine:** Users learn capital allocation by actively managing Share Dilution, Stock Buybacks, Dividend Yields, IPOs, and Mergers & Acquisitions (M&A).
* **🌍 Macroeconomic Simulator:** A fully functional mock economy engine (`EconomyEngine.ts`) that simulates stock market volatility, bond yields, crypto fluctuations, and inflation based on dynamic world events.
* **⚖️ Executive Life & Resource Management:** Teaches the importance of work-life balance. Executive stress, health (Gym/Sanctuary), and relationships directly impact corporate decision-making capabilities.
* **🧠 Procedural Event System:** An AI-driven event builder (`aiEventBuilder.ts`) generates realistic business crises (e.g., supply chain disruptions, PR scandals, hostile takeovers) requiring critical problem-solving.

---

## 🛠 Technical Architecture & Engineering

Transitioning from a traditional "game" to a serious educational simulator required a robust, scalable architecture. As the sole architect, I implemented:

1.  **Massive Scale State Management:** Orchestrated 15+ interconnected global stores (Company, Market, Portfolio, Education, Player Stats) ensuring synchronous updates without race conditions.
2.  **Algorithmic Economy:** Built a proprietary mathematics engine to calculate real-time company valuations, compound interest, and market trends based on player actions.
3.  **Modular Event Engine:** A highly decoupled `eventEngine` that parses JSON/TypeScript-based event nodes, allowing educators to easily inject custom "business case studies" into the simulation.
4.  **Optimized UI Rendering:** Heavy data visualizations (market charts, portfolio distributions) optimized with `React.memo` and localized state to maintain 60 FPS on mobile devices.

---


## 👨‍💻 Architected By

**Salih Kilic** *Applying "Expert Power" to Ed-Tech. Bridging the gap between complex software engineering and strategic educational tools.*

🔗 https://www.linkedin.com/in/salih-kilic1/ | 📧 ssalih.kilicc@gmail.com
