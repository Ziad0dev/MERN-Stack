# MERN-Stack: React Node Ecommerce from Scratch to Deployment
React storefront for the [Mern-crud](https://github.com/Ziad0dev/Mern-crud) API.

Features: product grid with search, category filter and sorting; product page with related products; cart persisted in localStorage; sign up / sign in (JWT); checkout; order history; admin panel for categories, products and order status.

## Run
Start the Mern-crud API on port 8000, then:
```sh
npm install
npm run dev            # proxies /api to http://localhost:8000 (override with API_URL=...)
```
For a production build pointing elsewhere: `VITE_API_URL=https://api.example.com/api npm run build`.

The first account you sign up with becomes the admin.
