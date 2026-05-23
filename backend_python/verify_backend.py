import requests
import os

BASE_URL = "http://localhost:3001"
EMAIL = os.getenv("VERIFY_BACKEND_EMAIL")
PASSWORD = os.getenv("VERIFY_BACKEND_PASSWORD")

def test_backend():
    if not EMAIL or not PASSWORD:
        print("❌ VERIFY_BACKEND_EMAIL and VERIFY_BACKEND_PASSWORD must be set")
        return

    print("--- 1. Login ---")
    login_payload = {"email": EMAIL, "password": PASSWORD}
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        r.raise_for_status()
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        try:
             print(r.text)
        except: pass
        return

    print("\n--- 2. Add Grocery Item (Fix Check) ---")
    item_payload = {
        "name": "Script Test Item",
        "quantity": 1,
        "unit": "pcs",
        "category": "Other"
    }
    try:
        r = requests.post(f"{BASE_URL}/groceries", json=item_payload, headers=headers)
        if r.status_code == 201:
            print("✅ Create Grocery successful")
        else:
            print(f"❌ Create Grocery failed: {r.status_code} - {r.text}")
    except Exception as e:
         print(f"❌ Create Grocery Exception: {e}")


    print("\n--- 3. Analyze Photo (Gemini 3.0 Check) ---")
    img_path = "/mnt/coding-hdd/Coding Projekte/GitClone/smart-pantry/TestGroceries.png"
    if not os.path.exists(img_path):
        print(f"❌ Image not found at {img_path}")
        return

    try:
        with open(img_path, "rb") as f:
            files = {"file": ("TestGroceries.png", f, "image/png")}
            r = requests.post(f"{BASE_URL}/photo-recognition/analyze-fridge", headers=headers, files=files)
        
        if r.status_code == 200:
            data = r.json()
            foods = data.get("recognized_foods", [])
            print(f"✅ Analysis successful. Recognized: {foods}")
            if not foods:
                print("⚠️ Warning: No foods recognized (Empty list)")
        else:
            print(f"❌ Analysis failed: {r.status_code} - {r.text}")

    except Exception as e:
        print(f"❌ Analysis Exception: {e}")

    print("\n--- 4. Refresh Token Check ---")
    try:
        # Wir brauchen das Refresh Token aus dem Login Step. 
        # Da wir es oben nicht gespeichert haben, loggen wir neu ein oder holen es.
        # Einfacher: Login oben anpassen um return value zu nutzen? 
        # Nein, wir machen einfach nochmal einen Login hier.
        r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        r.raise_for_status()
        data = r.json()
        refresh_token = data.get("refresh_token")
        
        if not refresh_token:
            print("❌ No refresh token received")
            return

        refresh_payload = {"refresh_token": refresh_token}
        r2 = requests.post(f"{BASE_URL}/auth/refresh", json=refresh_payload)
        
        if r2.status_code == 200:
            print("✅ Refresh Token successful")
            print(f"   New Access Token: {r2.json().get('access_token')[:10]}...")
        else:
            print(f"❌ Refresh Token failed: {r2.status_code} - {r2.text}")

    except Exception as e:
        print(f"❌ Refresh Token Exception: {e}")

    except Exception as e:
        print(f"❌ Refresh Token Exception: {e}")

    print("\n--- 5. Runtime Error Checks (Translations & Cooked) ---")
    try:
        # Nutzung des Tokens
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test Translation
        trans_payload = {"text": "Chicken"}
        r_trans = requests.post(f"{BASE_URL}/photo-recognition/translate-title", json=trans_payload, headers=headers)
        if r_trans.status_code == 200:
             print(f"✅ Translate Title: {r_trans.json()}")
        else:
             print(f"❌ Translate Title Failed: {r_trans.status_code} - {r_trans.text}")
        
        # Test Cooked Recipes
        r_cooked = requests.get(f"{BASE_URL}/photo-recognition/cooked-recipes", headers=headers)
        if r_cooked.status_code == 200:
             print(f"✅ Cooked Recipes: Found {len(r_cooked.json())} items")
        else:
             print(f"❌ Cooked Recipes Failed: {r_cooked.status_code} - {r_cooked.text}")

        # Test Usage (500 fix)
        r_usage = requests.get(f"{BASE_URL}/me/usage", headers=headers)
        if r_usage.status_code == 200:
             print(f"✅ Usage Stats: {r_usage.json()}")
        else:
             print(f"❌ Usage Stats Failed: {r_usage.status_code} - {r_usage.text}")

    except Exception as e:
        print(f"❌ Runtime Check Exception: {e}")

if __name__ == "__main__":
    test_backend()
