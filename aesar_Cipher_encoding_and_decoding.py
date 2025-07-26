def caesar_encode(message, shift):
    encoded_message = ""
    for char in message:
        if char.isalpha():  
            shift_amount = shift % 26  
            if char.isupper():
                new_char = chr((ord(char) - ord('A') + shift_amount) % 26 + ord('A'))
            else:
                new_char = chr((ord(char) - ord('a') + shift_amount) % 26 + ord('a'))
            encoded_message += new_char
        else:
            encoded_message += char
    return encoded_message


def caesar_decode(message, shift):
    return caesar_encode(message, -shift)

#let me take
plaintext = "This is an assignment"
shift_value = 3

encoded = caesar_encode(plaintext, shift_value)
print("Encoded Message:", encoded)

decoded = caesar_decode(encoded, shift_value)
print("Decoded Message:", decoded)
