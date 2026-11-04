import json
import os
from datetime import datetime

class QuoteFollowUpAgent:
    """
    Agentė 3: Sophie (European Commercial Quotes & Follow-Up Engine)
    Apskaičiuoja kainą su pristatymu į Vokietiją/Olandiją/Prancūziją ir seka atsakymus.
    """
    def __init__(self, config: dict, llm_client):
        self.config = config
        self.llm = llm_client
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.quotes_file = os.path.join(self.data_dir, "quotes.json")

    def generate_quotes_and_followups(self, leads: list) -> list:
        print("[Agentė Sophie] Skaičiuojami komerciniai pasiūlymai su transporto kaštais į Europą...")
        
        quotes = []
        shipping_table = self.config.get("shipping_costs_per_tub", {})
        models = {m["id"]: m for m in self.config.get("models", [])}

        for lead in leads:
            country = lead.get("country", "Vokietija (DE)")
            ship_cost = shipping_table.get(country, 380.00)
            
            # Pasirenkamas rekomenduojamas modelis
            model_key = "model-integrated-200"
            if "Deluxe" in lead.get("recommended_model", ""):
                model_key = "model-square-deluxe"
            elif "Classic" in lead.get("recommended_model", ""):
                model_key = "model-external-200"
                
            model_data = models.get(model_key, self.config["models"][0])

            # Nustatome ar B2B didmena ar B2C kaina
            is_dealer = "Dileris" in lead.get("category", "") or "Händler" in lead.get("category", "")
            unit_price = model_data["b2b_dealer_price"] if is_dealer else model_data["b2c_retail_eu_price"]
            supplier_cost = model_data["supplier_cost_lt"]
            
            total_client_price = unit_price + ship_cost
            net_profit_per_unit = unit_price - supplier_cost

            quote = {
                "quote_id": f"Q-{lead['id']}",
                "company_name": lead["company_name"],
                "contact_person": lead["contact_name"],
                "country": country,
                "model_name": model_data["name"],
                "model_specs": model_data["specs"],
                "tub_price_eur": unit_price,
                "doorstep_delivery_eur": ship_cost,
                "total_client_price_eur": total_client_price,
                "supplier_cost_eur": supplier_cost,
                "net_profit_eur": net_profit_per_unit,
                "profit_margin_percent": round((net_profit_per_unit / total_client_price) * 100, 1),
                "lead_type": "B2B Wholesale" if is_dealer else "Commercial Hospitality",
                "followup_schedule": [
                    {"day": 3, "action": "Follow-up el. laiškas: ar peržiūrėjote PDF techninius brėžinius?"},
                    {"day": 7, "action": "Follow-up žinutė: pranešimas apie planuojamą vilkiko išvykimą iš Lietuvos į jūsų regioną."}
                ],
                "created_at": datetime.now().isoformat()
            }
            quotes.append(quote)

        with open(self.quotes_file, "w", encoding="utf-8") as f:
            json.dump(quotes, f, indent=2, ensure_ascii=False)

        print(f"[Agentė Sophie] Paskaičiuota {len(quotes)} komercinių pasiūlymų į {self.quotes_file}")
        return quotes
