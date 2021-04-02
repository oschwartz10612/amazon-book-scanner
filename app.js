require('dotenv').config()
const SellingPartnerAPI = require('amazon-sp-api');

let sellingPartner = new SellingPartnerAPI({
    region:'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token: process.env.REFRESH_TOKEN // The refresh token of your app user
});



// (async() => {
//     try {
//       let sellingPartner = new SellingPartnerAPI({
//         region:'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
//         refresh_token:'Atzr|IwEBIC4AJDFKXvRUub4yuIarsXbxYdBhZNCBWrr3hIOBoOlUcHvOg82Tbu6GB86EwfEXqyX2yly_I952qCNQK6uNpH1svUskry_GHLJhsejMON93sRA3SlrhZgyC2hE5vRoCNbtTZqIE1uSfG7xPaKNw6bDvVFxW1Z9H4tcmkYm4P7ZKl8z3lGTFP6OBn9zKDO76KUi0TCXfqBn7rMCFP5bz--sxrOWLF8OoXbrVR2mLfFFwGjKBSpK_TZdG-Ulb1n3S4llUjtbiosJLcLD_DhEjF1Fm1xZ3ADqzxNABT8vzTDbQqPat1uTeCbfIygghAsVaE-4' // The refresh token of your app user
//       });
//       let res = await sellingPartner.callAPI({
//         operation:'listCatalogItems',
//         query: {
//             MarketplaceId: 'ATVPDKIKX0DER',
//             ISBN:'9781568811024'
//         }
//       });
//       console.log(JSON.stringify(res));
//     } catch(e){
//       console.log(e);
//     }
//   })();

//   (async() => {
//     try {
//       let sellingPartner = new SellingPartnerAPI({
//         region:'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
//         refresh_token:'Atzr|IwEBIC4AJDFKXvRUub4yuIarsXbxYdBhZNCBWrr3hIOBoOlUcHvOg82Tbu6GB86EwfEXqyX2yly_I952qCNQK6uNpH1svUskry_GHLJhsejMON93sRA3SlrhZgyC2hE5vRoCNbtTZqIE1uSfG7xPaKNw6bDvVFxW1Z9H4tcmkYm4P7ZKl8z3lGTFP6OBn9zKDO76KUi0TCXfqBn7rMCFP5bz--sxrOWLF8OoXbrVR2mLfFFwGjKBSpK_TZdG-Ulb1n3S4llUjtbiosJLcLD_DhEjF1Fm1xZ3ADqzxNABT8vzTDbQqPat1uTeCbfIygghAsVaE-4' // The refresh token of your app user
//       });
//       let res = await sellingPartner.callAPI({
//         operation:'getCompetitivePricing',
//         query: {
//             MarketplaceId: 'ATVPDKIKX0DER',
//             Asins: ['1568811020'],
//             ItemType: 'Asin'
//         }
//       });
//       console.log(JSON.stringify(res));
//     } catch(e){
//       console.log(e);
//     }
//   })();