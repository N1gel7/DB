async function loadOrders() {
    try {
        const res = await fetch("/orders");

        if (!res.ok) {
            const errorDetails = await res.text();
            throw new Error(`Server error: ${res.status} - ${errorDetails}`);
        }

        const orders = await res.json();
        console.log("✅ Orders fetched:", orders);

        // Debug: Inspect the first order's created_at to understand its format
        if (orders.length > 0) {
            console.log("📅 First order date debug info:");
            console.log("- Raw created_at value:", orders[0].created_at);
            console.log("- Type:", typeof orders[0].created_at);
            
            const dateAttempt = new Date(orders[0].created_at);
            console.log("- Parsed as Date object:", dateAttempt);
            console.log("- Is valid date:", !isNaN(dateAttempt.getTime()));
        }

        const tbody = document.querySelector("#ordersTable tbody");
        tbody.innerHTML = ''; // Clear existing rows

        orders.forEach(order => {
            let mealDetails = "No meal data";

            if (Array.isArray(order.meal_data)) {
                mealDetails = order.meal_data
                    .map(item => `${item.meal} x${item.qty}`)
                    .join(", ");
            }

            // Debug the specific date for this row
            console.log(`📅 Order ${order.id} date:`, order.created_at);
            
            // ✅ Very robust date handling
            let formattedDate = "Invalid Date";
            
            if (order.created_at) {
                // Try multiple approaches to parse the date
                let dateObj;
                
                // Approach 1: Direct parsing
                dateObj = new Date(order.created_at);
                
                // Approach 2: If it's a MySQL date format like '2025-03-31 12:34:56'
                if (isNaN(dateObj.getTime()) && typeof order.created_at === 'string') {
                    // Try replacing space with T for ISO format
                    dateObj = new Date(order.created_at.replace(' ', 'T'));
                }
                
                // Check if we have a valid date now
                if (!isNaN(dateObj.getTime())) {
                    // Format as DD/MM/YYYY
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    formattedDate = `${day}/${month}/${year}`;
                    console.log(`✅ Successfully formatted date: ${formattedDate}`);
                } else {
                    console.log(`❌ Failed to parse date: ${order.created_at}`);
                }
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.first_name} ${order.last_name}</td>
                <td>${order.phone_number}</td>
                <td>${mealDetails}</td>
                <td>${formattedDate}</td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("❌ Error loading orders:", error);
        alert("Failed to load orders. Please check your server and try again.");
    }
}

loadOrders();