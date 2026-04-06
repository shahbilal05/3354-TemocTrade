
def validate_listing_price(price):
	# this checks that price is an int or float and is greater than 0
	if isinstance(price, (int, float)) and price >0: 
		return True 
	else:
		return False
