let mix = require('laravel-mix');
require('laravel-mix-eslint');

mix.setPublicPath('public');
mix.webpackConfig({
  externals: {
    'ace': 'ace'
  }
});

mix
  .sass('resources/assets/sass/app.scss', './public/css/pyangelo.css', {sassOptions: { quietDeps: true }})
  .js('resources/assets/js/app.js', './public/js/')
  .js('resources/assets/js/playground.js', './public/js/')
  .eslint()
  .version();
