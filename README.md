# Aurelia: AI in E-Commerce (AI/ML micro-project)

A luxury shopping prototype where the AI runs fully in the browser. No server, no libraries, no installs.

## How to run
Extract the zip and double-click `index.html`. (Internet is only needed for the Google Fonts; without it the page uses default fonts.)

## Folder structure
```
aurelia-ai-ecommerce/
├── index.html    page layout (Shop, Concierge, AI Insights tabs)
├── style.css     navy / beige / gold theme, light + dark mode
└── script.js     all logic, in labelled sections (in this order):
                  DATA, UTILS, STATE, ML 1 recommender, ML 2 NLP search,
                  ML 3 sentiment, UI, APP
```

## The three AI features
1. **Recommendations (script.js, section ML 1):** each product is a tag vector. Every view (+1), like (+3) and add-to-bag (+5) updates the user's profile vector. Products are ranked by cosine similarity: `cos(profile, product) = (profile · product) / (|profile| × |product|)`. The cold-start problem is shown until the user interacts.
2. **NLP search and concierge (script.js, section ML 2):** regular expressions and keyword synonyms extract category, budget ("under 20k") and style from plain English, then filter and rank the catalogue.
3. **Sentiment analysis (script.js, section ML 3):** a word-score lexicon with negation ("not good" flips the sign) and intensifiers ("very", "absolutely" scale the score). The total is squashed with tanh into a 0-100 score.

