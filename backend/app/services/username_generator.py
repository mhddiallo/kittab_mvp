import random
import string

ANIMALS = [
    "Lapin", "Tigre", "Renard", "Panda", "Koala", "Lion", "Zèbre", "Girafe",
    "Perroquet", "Pingouin", "Hibou", "Dauphin", "Requin", "Jaguar", "Guépard",
    "Éléphant", "Gazelle", "Flamant", "Crocodile", "Caméléon", "Gorille", "Lynx",
    "Ocelot", "Phacochère", "Tatou", "Wombat", "Bison", "Caracal", "Serval",
]

ADJECTIVES = [
    "Malin", "Rapide", "Sage", "Courageux", "Drôle", "Curieux", "Endormi",
    "Joyeux", "Sympa", "Espiègle", "Bavard", "Discret", "Pétillant", "Fougueux",
    "Tranquille", "Farouche", "Brillant", "Futé", "Coquin", "Malicieux",
    "Vaillant", "Gaillard", "Intrépide", "Radieux", "Chaleureux",
]


def generate_username() -> str:
    animal = random.choice(ANIMALS)
    adj = random.choice(ADJECTIVES)
    suffix = ''.join(random.choices(string.digits, k=3))
    return f"{animal}{adj}{suffix}"
