#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import requests
import logging

logger = logging.getLogger('orchestrator.whatsapp')

class WhatsAppManager:
    def __init__(self):
        self.token = os.getenv('META_ACCESS_TOKEN')
        self.phone_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.my_number = os.getenv('MY_PHONE_NUMBER')

    def send_message(self, text):
        """Invia un messaggio di testo semplice via WhatsApp"""
        if not all([self.token, self.phone_id, self.my_number]):
            logger.error("❌ Configurazione WhatsApp incompleta.")
            return False

        url = f"https://graph.facebook.com/v22.0/{self.phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": self.my_number,
            "type": "text",
            "text": {"body": text}
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                logger.info(f"✅ Messaggio inviato a {self.my_number}")
                return True
            else:
                logger.error(f"❌ Errore WhatsApp API: {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ Errore invio WhatsApp: {e}")
            return False
