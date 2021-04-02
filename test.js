require('dotenv').config()
const SellingPartnerAPI = require('amazon-sp-api');

  (async() => {
    try {
      let sellingPartner = new SellingPartnerAPI({
        region:'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
        refresh_token:'Atzr|IwEBIC4AJDFKXvRUub4yuIarsXbxYdBhZNCBWrr3hIOBoOlUcHvOg82Tbu6GB86EwfEXqyX2yly_I952qCNQK6uNpH1svUskry_GHLJhsejMON93sRA3SlrhZgyC2hE5vRoCNbtTZqIE1uSfG7xPaKNw6bDvVFxW1Z9H4tcmkYm4P7ZKl8z3lGTFP6OBn9zKDO76KUi0TCXfqBn7rMCFP5bz--sxrOWLF8OoXbrVR2mLfFFwGjKBSpK_TZdG-Ulb1n3S4llUjtbiosJLcLD_DhEjF1Fm1xZ3ADqzxNABT8vzTDbQqPat1uTeCbfIygghAsVaE-4' // The refresh token of your app user
      });
      let res = await sellingPartner.callAPI({
        operation:'getMyFeesEstimateForASIN',
        path: {
            Asin: '1118879740'
        },
        body: {
            FeesEstimateRequest: {
                MarketplaceId: 'ATVPDKIKX0DER',
                IsAmazonFulfilled: false,
                PriceToEstimateFees: {
                    ListingPrice: {
                        CurrencyCode: 'USD',
                        Amount: 10
                    },
                    Shipping: {
                        CurrencyCode: 'USD',
                        Amount: 3.36
                    },
                },
                Identifier: '12'
            }
        }
      });
      console.log(JSON.stringify(res, null, 2));
    } catch(e){
      console.log(e);
    }
  })();