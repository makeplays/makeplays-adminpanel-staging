# MakePlays Frontend

## Requirements

- Node.js (v18 or above recommended)
- npm or yarn

## Installation

Install dependencies:

npm install

---

## Run the Project

### Local Development

npm start  

---

### Build for Production

npm run build  

---

## Scripts

    "start": "react-scripts start",
    "build": "react-scripts build",
    "build_demo": "REACT_APP_MODE=demo GENERATE_SOURCEMAP=false react-scripts build",
    "build_production": "REACT_APP_MODE=production GENERATE_SOURCEMAP=false react-scripts build",

---


## Notes

- Make sure backend server is running before starting frontend  
- Update API URL in `.env` files based on environment  
- Do not commit `.env` files (add to `.gitignore`)  
