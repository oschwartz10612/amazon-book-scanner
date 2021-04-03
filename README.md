# Amazon Seller Book Profitability Tool

A simple script that uses the Amazon Seller API to quickly determine the profitability of selling a book on Amazon FBA by scanning its barcode.

## How does this work?

1. Using a barcode scanner, scan the barcode ISBN into the prompt.

2. Using the Amazon API, the script finds the ASIN number for the ISBN.
    * If there are multiple titles, it creates a prompt to choose.

3. Using the ASIN, it looks up the competitive pricing for the book as well as the estimated fees using FBA.

4. Competitive pricing - fees = profitability.  If this is above a threshold it plays a sound to let the scanner know it is profitable, if it is not you get a different sound. It then creates a listing with the book information. 
    * NOTE: This does not create FBA listings; you must convert that later.

## Installation

Make sure you have nodejs installed. 

```
$ git clone https://github.com/oschwartz10612/amazon-book-scanner.git

$ npm install
```

## Usage

Configure .env variables. You can use the [Amazon API guide](https://github.com/amzn/selling-partner-api-docs/blob/main/guides/en-US/developer-guide/SellingPartnerApiDeveloperGuide.md) to learn how to generate these values.

```
node app.js
```