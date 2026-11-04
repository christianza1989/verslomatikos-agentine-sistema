"""
Modulis įkvėptas msitarzewski/agency-agents 'sales-outreach' ir 'outbound-strategist' metodologijos.
Užtikrina konsultacinį, neįkyrų pardavimą ir pašalina visas Europos dilerių bei glampingų baimes.
"""

class EuropeanObjectionHandler:
    """
    Tvarko dažniausius vokiečių, prancūzų ir skandinavų pirkėjų prieštaravimus.
    """
    OBJECTIONS = {
        "why_lithuania": {
            "question": "Kodėl turėtume pirkti iš Lietuvos, o ne iš vietinio Vokietijos tiekėjo?",
            "response_de": (
                "Sehr verständliche Frage. Die meisten sogenannten 'deutschen Anbieter' importieren die Wannen "
                "entweder teuer über Großhändler oder aus Fernost mit schwankender Qualität. "
                "Wir fertigen direkt in Litauen in traditioneller Handarbeit mit finnischem ThermoWood "
                "und Edelstahl AISI 316. Sie erhalten CE-zertifizierte Premium-Qualität direkt ab Werk "
                "mit 2 Jahren EU-Garantie – sparen sich aber 1.200 € bis 1.800 € Zwischenhändleraufschlag."
            ),
            "response_en": (
                "A very valid question. Most local resellers source through multiple distributor layers, adding 40-50% markups. "
                "By sourcing directly from our factory in Lithuania, you get authentic Nordic ThermoWood, AISI 316 marine-grade stoves, "
                "full CE compliance and a 2-year warranty – keeping an extra €1,200 to €1,800 profit margin per unit."
            )
        },
        "shipping_safety": {
            "question": "Kas nutiks, jei kubilas bus pažeistas transportuojant?",
            "response_de": (
                "Alle unsere Transporte nach Deutschland und Mitteleuropa sind zu 100% über CMR-Versicherung gedeckt. "
                "Die Wannen sind auf maßgefertigten Holzgestellen mit Schutzfolie fixiert und werden mit Hebebühne "
                "direkt an Ihren Wunschort geliefert. Vor dem Abladen prüfen Sie die Ware – im unwahrscheinlichen "
                "Schadensfall haften wir sofort und unbürokratisch."
            ),
            "response_en": (
                "Every shipment is 100% insured under international CMR freight insurance. Each tub is secured on a custom "
                "cradle with protective industrial wrapping and delivered with a hydraulic tail-lift right to your gate. "
                "In the rare event of transit damage, it is fully covered and handled immediately by us."
            )
        },
        "sample_order": {
            "question": "Ar galime užsakyti 1 demonstracinį kubilą (Sample / Showroom)?",
            "response_de": (
                "Selbstverständlich! Wir wissen, dass Händler die Verarbeitungsqualität zuerst mit eigenen Händen "
                "spüren wollen. Sie können ein einzelnes Ausstellungsstück (Showroom-Modell) zu Großhandelskonditionen "
                "bestellen. Bei einer Folgebestellung (ab 3 Einheiten) schreiben wir Ihnen zusätzlich 200 € auf die Gesamtrechnung gut."
            ),
            "response_en": (
                "Absolutely! We encourage new partners to order a single showroom demo unit at full wholesale rates. "
                "When you place your first follow-up order (3+ units), we credit €200 back towards your account."
            )
        }
    }

    @classmethod
    def get_solution(cls, objection_key: str, lang: str = "DE") -> str:
        data = cls.OBJECTIONS.get(objection_key, {})
        if lang.upper() == "DE":
            return data.get("response_de", data.get("response_en", ""))
        return data.get("response_en", "")
