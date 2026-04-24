# **App Name**: dks ShopManager

## Core Features:

- Persistent Data Storage (PostgreSQL): Backend API endpoints for Create, Read, Update, and Delete (CRUD) operations, ensuring data integrity and persistence across deployments on Railway, utilizing PostgreSQL as the database.
- User Authentication & Role-Based Access Control: Secure user authentication with distinct roles (Admin, Seller) and corresponding role-based access control (RBAC) to manage permissions across the application, with hashed passwords.
- Product Catalog & Inventory Management: Allow admins and sellers to perform complete CRUD operations (Add, Modify, Delete) on product listings, including details like name, category (e.g., keyboard, mouse, screen), purchase price, selling price, stock quantity, and image URL.
- Point of Sale (POS) System: A dedicated interface for sellers to easily select products, adjust quantities, process sales, and automatically decrement stock levels. Supports various payment modes.
- Customer Order Page: A public-facing home page allowing customers to browse products, select items, and place orders conveniently.
- Sales & Transaction History: Display a detailed list of recent sales transactions with filtering options by date, mode of payment, and product. This feature records sales ID, product ID, quantity sold, sale date, total amount, and payment mode.
- Diverse Payment Gateway Integration: Integrate various payment options including Pi Network, Mobile Money (e.g., specific providers), and Cash transactions for customer orders and POS sales.
- Sales & Performance Dashboard: Provide administrators with a visual summary dashboard displaying key metrics such as total daily sales, products out of stock, and net profit, using modern card components.
- Backend API Server (Node.js/Express): A robust Node.js and Express.js API server to handle data requests from the frontend and interact with the PostgreSQL database, supporting all application functionalities.

## Style Guidelines:

- Overall Color Palette: An elegant dark scheme to convey stability and professionalism, complemented by a 'Glossy' aesthetic with subtle gradients and reflections.
- Primary Color: A reliable and deep blue, '#2C7CCF' (HSL: 225, 70%, 45%), offering clarity and focus.
- Background Color: A heavily desaturated, very dark blue-gray, '#1F2226' (HSL: 225, 15%, 12%), to create depth and highlight interactive elements.
- Accent Color: A vibrant aqua or 'blue neon', '#66E3FF' (HSL: 195, 80%, 65%), for interactive elements and call-to-actions, ensuring strong contrast against the dark theme.
- Headlines and Body Text: 'Inter' (a grotesque-style sans-serif) for a modern, objective, and highly legible experience across all text, fitting for a data management interface.
- Icons: Clean, minimalist line icons for navigation and actions (e.g., 'add', 'edit', 'delete', 'cart'), maintaining a streamlined and functional aesthetic.
- Layout: A structured, dashboard-like design with clear data tables, product displays, order forms, and input forms, prioritizing readability and efficient interaction. The design must be 'Mobile-First' to ensure usability on smartphones.
- Animation: Subtle and functional transitions for state changes, form submissions, and order updates, providing user feedback without visual clutter, contributing to the 'Glossy' feel.