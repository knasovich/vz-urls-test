const runApplitoolsFullScreen = require('../helpers/applitools_fullpage');


const paths = [
  '?exp=127',
];

describe('VZ brand site - promotions: Full Page Screenshots', () => {
  it('Should Take Full Page Screenshot', async () => {
    paths.forEach((page) => {
      runApplitoolsFullScreen(page);
    });
  });
});
