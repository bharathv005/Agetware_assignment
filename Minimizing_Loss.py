def minimize_loss(prices):
    n = len(prices)
    min_loss = float('inf')
    buy_year = -1
    sell_year = -1

    for i in range(n):
        for j in range(i + 1, n):  
            if prices[j] < prices[i]:  
                loss = prices[i] - prices[j]
                if loss < min_loss:
                    min_loss = loss
                    buy_year = i + 1  
                    sell_year = j + 1

    if min_loss == float('inf'):
        print("No possible loss.")
    else:
        print(f"Buy in year {buy_year}, sell in year {sell_year}, minimum loss: {min_loss}")



prices = [20, 15, 7, 2, 13]
minimize_loss(prices)
