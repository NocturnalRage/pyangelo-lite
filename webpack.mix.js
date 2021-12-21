let mix = require('laravel-mix');
require('laravel-mix-eslint');

mix.setPublicPath('public/pyangelo');
mix.webpackConfig({
  externals: {
    'ace': 'ace'
  }
});

mix
  .sass('resources/assets/sass/app.scss', './public/pyangelo/css/pyangelo.css', {sassOptions: { quietDeps: true }})
  .js('resources/assets/js/playground.js', './public/pyangelo/js/')
  .eslint()
  .version();
