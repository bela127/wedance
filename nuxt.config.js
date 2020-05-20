const isProd = process.env.NODE_ENV === 'production'

const app = {
  name: 'WeDance',
  description: 'We bring dancers together',
  social: {},
  url: 'https://wedance.netlify.app',
  cover: '/cover/wide.png'
}

export default {
  mode: 'spa',
  /*
   ** Headers of the page
   */
  head: {
    title: app.name,
    bodyAttrs: {
      class: 'bg-white'
    },
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#2a1b3c' },
  components: true,
  /*
   ** Global CSS
   */
  css: [
    '@/assets/css/typography.css',
    '@/assets/css/vendors.scss',
    '@/assets/css/animation.css'
  ],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '~/plugins/composition-api',
    '~/plugins/firebase',
    '~/plugins/router',
    '~/plugins/directives'
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://github.com/nuxt-community/stylelint-module
    '@nuxtjs/stylelint-module',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss'
    // Doc: https://composition-api.now.sh/
    // 'nuxt-composition-api'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/pwa',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    '@nuxtjs/sentry',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'portal-vue/nuxt',
    '@nuxtjs/device',
    'nuxt-i18n'
  ],
  purgeCSS: {
    enabled: false
  },
  pwa: {
    workbox: {
      offline: true,
      dev: false,
      pagesURLPattern: '/.*'
    },
    meta: {
      name: app.name,
      description: app.description,
      ogHost: app.url,
      ogImage: app.cover,
      nativeUI: true,
      twitterSite: '@' + app.social.twitter
    },
    manifest: {
      name: app.name,
      short_name: app.name,
      start_url: '/?standalone=true',
      background_color: '#ece3f7',
      lang: 'en'
    }
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      config.resolve.alias.vue = 'vue/dist/vue.common'

      const svgRule = config.module.rules.find((rule) => rule.test.test('.svg'))

      svgRule.test = /\.(png|jpe?g|gif|webp)$/

      config.module.rules.push({
        test: /\.svg$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true
            }
          }
        ]
      })

      config.module.rules.push({
        test: /\.yml$/,
        use: 'js-yaml-loader'
      })
    }
  },
  env: {
    app,
    firebase: {
      config: {
        apiKey: 'AIzaSyAnUrpcBAo-5A7qr8ysCcin29n2VUp2cA0',
        authDomain: 'wedance-4abe3.firebaseapp.com',
        databaseURL: 'https://wedance-4abe3.firebaseio.com',
        projectId: 'wedance-4abe3',
        storageBucket: 'wedance-4abe3.appspot.com',
        messagingSenderId: '971322878414',
        appId: '1:971322878414:web:6d09b0bf2cf3ab9bc7639f',
        measurementId: 'G-98CW1KK933'
      },
      services: {
        auth: true,
        firestore: true,
        analytics: isProd
      }
    }
  },
  sentry: {
    disabled: !isProd,
    dsn:
      'https://c53d1205cc554ab7b45cec05f5228710@o340470.ingest.sentry.io/5243636'
  },
  robots: [
    {
      UserAgent: '*',
      Allow: '/'
    },
    {
      UserAgent: '*',
      Disallow: '/account'
    }
  ],
  sitemap: {
    hostname: app.url,
    routes: ['/']
  }
}
