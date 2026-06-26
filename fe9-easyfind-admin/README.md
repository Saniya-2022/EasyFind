# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


## **✅ Step : Rebuild Your Frontend**
Since **Tailwind might not have included styles in production**, run:  
```bash
rm -rf dist node_modules
npm install
npm run build
```

Move the new build to Nginx's public directory:  
```bash
sudo rm -rf /var/www/easyfind-admin/*
sudo cp -r dist/* /var/www/easyfind-admin/
sudo systemctl restart nginx
```

---

## **✅ Step 6: Clear Browser Cache and Reload**
- **Open DevTools (F12) → Network Tab**
- **Check "Disable Cache"**
- **Hard refresh (`Ctrl + Shift + R`)**
