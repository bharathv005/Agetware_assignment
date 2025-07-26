def format_indian_currency(number):
    num_parts = str(number).split('.')
    integer_part = num_parts[0]
    decimal_part = '.' + num_parts[1] if len(num_parts) > 1 else ''

    
    if len(integer_part) <= 3:
        return integer_part + decimal_part
    else:
        last_three = integer_part[-3:]
        remaining = integer_part[:-3]
        result = ''
        while len(remaining) > 2:
            result = ',' + remaining[-2:] + result
            remaining = remaining[:-2]

        result = remaining + result
        return result + ',' + last_three + decimal_part



num = 123456.789
formatted = format_indian_currency(num)
print("Indian Currency Format:", formatted)
