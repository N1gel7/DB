document.getElementById("orderForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this);
    const selectedMeals = [];

    // Process standalone meals
    if (formData.get("standalone_meals")) {
        // Handle multiple selections
        const standaloneMeals = formData.getAll("standalone_meals");
        
        for (const meal of standaloneMeals) {
            if (meal === "Bread" && formData.get("bread_qty")) {
                selectedMeals.push({
                    meal: "Bread",
                    qty: parseInt(formData.get("bread_qty"))
                });
            }
            if (meal === "Sandwich" && formData.get("sandwich_qty")) {
                selectedMeals.push({
                    meal: "Sandwich",
                    qty: parseInt(formData.get("sandwich_qty"))
                });
            }
        }
    }

    // Process combo meals
    if (formData.get("combo_meals")) {
        // Handle multiple selections
        const comboMeals = formData.getAll("combo_meals");
        
        for (const meal of comboMeals) {
            if (meal === "burger_fries" && formData.get("burger_fries_qty")) {
                selectedMeals.push({
                    meal: "Burger + Fries",
                    qty: parseInt(formData.get("burger_fries_qty"))
                });
            }
            if (meal === "pizza_drink" && formData.get("pizza_drink_qty")) {
                selectedMeals.push({
                    meal: "Pizza + Drink",
                    qty: parseInt(formData.get("pizza_drink_qty"))
                });
            }
        }
    }

    console.log("✅ Selected Meals:", selectedMeals); // Debugging

    if (selectedMeals.length === 0) {
        alert("❌ Please select at least one meal before submitting.");
        return;
    }

    // Correctly format data before sending
    const orderData = {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        phone_number: formData.get("phone_number"),
        meals: selectedMeals // ✅ Meals are now properly structured as an array
    };

    console.log("🚀 Sending Data:", JSON.stringify(orderData)); // Debugging

    try {
        const response = await fetch("http://localhost:3000/submit-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Order submitted successfully!");
            document.getElementById("orderForm").reset();
        } else {
            alert("❌ Error: " + result.error);
        }
    } catch (error) {
        console.error("Error submitting order:", error);
        alert("❌ Failed to submit order. Please try again.");
    }
});