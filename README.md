<div align="center">
  <img
    width="1200"
    height="475"
    alt="Eko Arbitrage Market Agent Banner"
    src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6"
  />
</div>

# Eko Arbitrage Market Agent

Eko Arbitrage Market Agent is a **Gemini 3–powered market intelligence web app** that helps users identify profitable arbitrage opportunities across Lagos markets and online stores.

The app analyzes real market price data, reasons over price differences, and presents clear, actionable deal recommendations. It supports both **English and Nigerian Pidgin**, and allows users to share verified deals instantly via WhatsApp.

This project was built for the **Gemini 3 Hackathon**.

---

## Live Demo

**Live Web App**  
https://lagos-arbitrage-agent.vercel.app/

---

## Features

- Gemini 3–powered reasoning over 1,200+ Lagos market price entries  
- Top arbitrage deals ranked by profit  
- Optional browser geolocation to estimate distance and pickup effort  
- English and Nigerian Pidgin language support  
- One-tap WhatsApp sharing for real-world trading workflows  

---

## Run Locally

### Prerequisites

- Node.js (v18 or later recommended)
- A Gemini API key

### Setup

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
