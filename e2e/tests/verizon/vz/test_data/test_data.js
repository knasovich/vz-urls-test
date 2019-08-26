module.exports = {
  promotionsBrandPage: {
    name: 'Promotions - Brand',
    path: 'home/rb/promotions',
    buttonSelector: 'section.banner a.btn',
    cValue: 'A004497',
    abrValue: 'FIVZ',
    popupCloseIconSelector: 'i.icon.icon-x-v2',
  },
  whyFiosBrandPage: {
    name: 'Why Fios - Brand',
    path: 'home/rb/why-fios',
    buttonSelector: 'section.banner a.btn',
    cValue: 'A004497',
    abrValue: 'FIVZ',
  },
  plansBrandPage: {
    name: 'Plans - Brand',
    path: 'home/rb/plans',
    buttonsSelector: 'div#plans-popular a.btn',
    cValue: 'A004497',
    abrValue: 'FIVZ',
    headerSelector: '//h1[contains(text(), "Shop Fios plans.")]',
  },
  plansBrandPageInternetOnly: {
    name: 'Plans - Brand - Internet Only',
    path: 'home/rb/plans#plans-internet-only',
    buttonsSelector: '//div[@id = "plans-internet-only"]//a[contains(text(), "Check availability")]',
    cValue: 'A004497',
    abrValue: 'FIVZ',
    headerSelector: '//h1[contains(text(), "Shop Fios plans.")]',
  },
  promotionsNonBrandPage: {
    name: 'Promotions - Non Brand',
    path: 'rnb/promotions',
    buttonSelector: 'section.banner a.btn',
    cValue: '5801122',
    abrValue: 'FIVZ',
  },
  whyFiosNonBrandPage: {
    name: 'Why Fios - Non Brand',
    path: 'rnb/why-fios',
    buttonSelector: 'section.banner a.btn',
    cValue: '5801122',
    abrValue: 'FIVZ',
  },
  plansNonBrandPage: {
    name: 'Plans - Non Brand',
    path: 'rnb/plans',
    buttonsSelector: 'div#plans-popular a.btn',
    cValue: '5801122',
    abrValue: 'FIVZ',
    headerSelector: '//h1[contains(text(), "Shop Fios plans.")]',
  },
  plansNonBrandPageInternetOnly: {
    name: 'Plans - Non Brand - Internet Only',
    path: 'rnb/plans#plans-internet-only',
    buttonsSelector: '//div[@id = "plans-internet-only"]//a[contains(text(), "Check availability")]',
    cValue: '5801122',
    abrValue: 'FIVZ',
    headerSelector: '//h1[contains(text(), "Shop Fios plans.")]',
  },
};
