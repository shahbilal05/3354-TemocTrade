
import __main__
import unittest # python library which allows for unit testing 
from market_logic import validate_listing_price # bring in our module to test

class TestMarketLogic (unittest.TestCase): # class to wrap different test cases
	def test_valid_price(self): # test valid
		self.assertTrue(validate_listing_price(15.50)) 
	def test_negativeInvalid_price(self): # test negative 
		self.assertFalse(validate_listing_price(-2.00))
	def test_zero_price(self): # test 0
		self.assertFalse(validate_listing_price(0))
	def test_string_input(self): # test string input
		self.assertFalse(validate_listing_price("twenty dollars"))
	def test_none_price(self): # test none
		self.assertFalse(validate_listing_price(None))

if __name__ == '__main__': # means you only run when script is run directly
	unittest.main()
