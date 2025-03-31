import express from "express";
import mysql from "mysql";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 3000;

app.use(express.json()); 
app.use(cors()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.log("❌ Database connection failed: " + err.stack);
    } else {
        console.log("✅ Database connected");
        verifyDatabaseSchema(); 
    }
});

function verifyDatabaseSchema() {
    db.query("DESCRIBE orders", (err, results) => {
        if (err) {
            console.log("❌ Error verifying schema:", err.message);
            
           
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log("⚠️ Table 'orders' does not exist. Creating it...");
                const createTableSQL = `
                    CREATE TABLE orders (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        first_name VARCHAR(50) NOT NULL,
                        last_name VARCHAR(50) NOT NULL,
                        phone_number VARCHAR(15) NOT NULL,
                        meal_data JSON NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `;
                db.query(createTableSQL, (createErr) => {
                    if (createErr) {
                        console.log("❌ Failed to create table:", createErr.message);
                    } else {
                        console.log("✅ Successfully created 'orders' table");
                    }
                });
            }
            return;
        }
        
        console.log("📊 Database schema for 'orders' table:");
        results.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
        });
        
        
        const mealDataColumn = results.find(col => col.Field === 'meal_data');
        if (!mealDataColumn) {
            console.log("❌ Warning: 'meal_data' column not found in schema!");
            console.log("⚠️ Attempting to create the missing column...");
            
            db.query("ALTER TABLE orders ADD COLUMN meal_data JSON NOT NULL", (alterErr) => {
                if (alterErr) {
                    console.log("❌ Failed to add column:", alterErr.message);
                } else {
                    console.log("✅ Successfully added 'meal_data' column");
                }
            });
        } else {
            console.log("✅ 'meal_data' column exists with type:", mealDataColumn.Type);
        }
    });
}

app.post("/submit-order", (req, res) => {
    console.log("🔹 Received Data:", JSON.stringify(req.body, null, 2)); // Debugging

    const { first_name, last_name, phone_number, meals } = req.body;

    if (!first_name || !last_name || !phone_number) {
        console.log("❌ Error: Missing required contact information.");
        return res.status(400).json({ error: "Missing required contact information." });
    }

    if (!Array.isArray(meals) || meals.length === 0) {
        console.log("❌ Error: Meals array is empty or not properly formatted.");
        return res.status(400).json({ error: "Please select at least one meal." });
    }

   
    if (meals.some(meal => !meal.meal || isNaN(meal.qty) || meal.qty <= 0)) {
        console.log("❌ Error: Invalid meal data.");
        return res.status(400).json({ error: "Invalid meal data. Ensure all meals have valid names and quantities." });
    }

    console.log("✅ Meals received:", meals); 

    const mealDataJSON = JSON.stringify(meals);
    

    const sql = "INSERT INTO orders (first_name, last_name, phone_number, meal_data) VALUES (?, ?, ?, ?)";

    db.query(sql, [first_name, last_name, phone_number, mealDataJSON], (err, result) => {
        if (err) {
            console.log("❌ Database error:", err.message);
            return res.status(500).json({ error: "Database error: " + err.message });
        }
        console.log("✅ Order inserted successfully with ID:", result.insertId);
        res.json({ message: "✅ Order submitted successfully!" });
    });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin.html");
});

app.get("/orders", (req, res) => {
    db.query("SELECT * FROM orders", (err, results) => {
        if (err) {
            console.log("❌ Error fetching orders: " + err.stack);
            return res.status(500).json({ error: err.message });
        }

        // Debug log the first result to see raw format
        if (results.length > 0) {
            console.log("📅 First order date from DB:", results[0].created_at);
            console.log("📅 Type:", typeof results[0].created_at);
        }

        const formattedResults = results.map(order => {
            let mealData;
            try {
                mealData = typeof order.meal_data === "string"
                    ? JSON.parse(order.meal_data)
                    : order.meal_data;
            } catch (e) {
                mealData = [];
            }

            // Ensure created_at is properly formatted
            // MySQL timestamps may be returned as Date objects
            let formattedDate = order.created_at;
            
            if (order.created_at instanceof Date) {
                // Format as ISO string for consistent handling
                formattedDate = order.created_at.toISOString();
                console.log("📅 Formatted date from Date object:", formattedDate);
            }

            return {
                ...order,
                meal_data: mealData,
                created_at: formattedDate
            };
        });

        res.json(formattedResults);
    });
});


app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});