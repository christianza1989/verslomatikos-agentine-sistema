import os
import json
import urllib.request
import urllib.error

class LLMClient:
    """
    Universali LLM integracija (OpenAI, Grok arba vietinis daugiakalbis generatorius).
    """
    def __init__(self):
        self.openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.grok_key = os.environ.get("GROK_API_KEY", "").strip()

    def generate(self, system_prompt: str, user_prompt: str, model: str = "gpt-4o-mini", temperature: float = 0.7) -> str:
        # 1. Grok API jei pateiktas raktas
        if self.grok_key:
            return self._call_openai_compatible("https://api.x.ai/v1/chat/completions", self.grok_key, "grok-beta", system_prompt, user_prompt, temperature)
            
        # 2. OpenAI API jei pateiktas raktas
        if self.openai_key:
            return self._call_openai_compatible("https://api.openai.com/v1/chat/completions", self.openai_key, model, system_prompt, user_prompt, temperature)
            
        # 3. Protingas daugiakalbis lokalus generatorius
        return self._fallback_multilingual_response(system_prompt, user_prompt)

    def _call_openai_compatible(self, endpoint: str, api_key: str, model: str, system_prompt: str, user_prompt: str, temp: float) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temp
        }
        try:
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[LLM ĮSPĖJIMAS] API klaida: {e}. Naudojamas vietinis generatorius.")
            return self._fallback_multilingual_response(system_prompt, user_prompt)

    def _fallback_multilingual_response(self, system_prompt: str, user_prompt: str) -> str:
        usr_lower = user_prompt.lower()
        
        # Vokiškas pasiūlymas dileriams ir glampingams
        if "germany" in usr_lower or "deutsch" in usr_lower or "vokietija" in usr_lower or "austria" in usr_lower:
            return (
                "Sehr geehrte Damen und Herren,\n\n"
                "wir sind ein führender litauischer Hersteller von hochwertigen, handgefertigten GFK-Badefässern (Hot Tubs) mit integriertem Edelstahlofen und ThermoWood-Verkleidung.\n\n"
                "Für Ihren Glamping- / Ferienhausbetrieb bieten unsere Badezuber die perfekte Möglichkeit, die Auslastung in den kälteren Herbst- und Wintermonaten um bis zu 35% zu steigern und einen höheren Übernachtungspreis zu erzielen.\n\n"
                "Warum direkt vom litauischen Hersteller?\n"
                "• Höchste europäische Handwerksqualität & CE-Zertifizierung\n"
                "• 2 Jahre Vollgarantie und langlebige GFK-Einsätze\n"
                "• Direkte Werkslieferung bis an Ihre Tür (ohne teure Zwischenhändler)\n\n"
                "Dürfen wir Ihnen unseren aktuellen Händler- / B2B-Katalog mit Großhandelspreisen unverbindlich als PDF zusenden?\n\n"
                "Mit freundlichen Grüßen,\nKlaus Bergmann\nExport Management | Baltic Hot Tubs Lithuania"
            )
        
        # Prancūziškas pasiūlymas
        elif "france" in usr_lower or "prancūzija" in usr_lower or "belgium" in usr_lower:
            return (
                "Bonjour,\n\n"
                "Nous sommes un fabricant direct de bains nordiques (hot tubs) haut de gamme en bois thermique et fibre de verre basé en Lituanie.\n\n"
                "Nos bains scandinaves avec poêle intégré permettent aux domaines de glamping et chalets d'augmenter significativement le taux d'occupation en basse saison et de générer un revenu supplémentaire par nuitée.\n\n"
                "Avantages direct usine:\n"
                "• Qualité artisanale certifiée CE & garantie 2 ans\n"
                "• Tarifs directs fabricant très compétitifs (marge revendeur de 35%)\n"
                "• Livraison rapide sécurisée dans toute la France et l'Europe\n\n"
                "Souhaitez-vous recevoir notre catalogue professionnel 2026 avec les tarifs préférentiels pour hébergements insolites?\n\n"
                "Cordialement,\nKlaus Bergmann | Baltic Hot Tubs Europe"
            )
            
        # Angliškas pasiūlymas (Olandija, Skandinavija, bendra ES)
        else:
            return (
                "Hello,\n\n"
                "We are a direct manufacturer of premium fiberglass & ThermoWood hot tubs handcrafted in Lithuania.\n\n"
                "Our wood-fired hot tubs with integrated stainless-steel heaters are engineered specifically for high-end glamping resorts, boutique rentals, and spa dealers looking for superior Scandinavian build quality at direct-from-factory pricing.\n\n"
                "Why partner with us?\n"
                "• Direct manufacturer pricing (35%+ margins for partners/dealers)\n"
                "• Fully CE certified with 2-year comprehensive European warranty\n"
                "• Doorstep delivery across Europe (single units or full truckloads)\n\n"
                "Would you like us to email you our 2026 B2B catalogue with wholesale pricing and delivery estimates?\n\n"
                "Best regards,\nKlaus Bergmann | Export Sales Manager"
            )
