<p align="center"><img src="https://crows-nest.io/favicon.png" width="150"/></p>
<h2 align="center">Crow's Nest</h2>
<p align="center">
Crow's Nest is a free and simple NFT portfolio tracker. Track and analyze your NFTs - floors, daily volume, minimal collection value, and more.
<br>
<a href="https://crows-nest.io/">https://crows-nest.io/</a>
</p>


# Setup
This website uses [Jekyll](https://jekyllrb.com/) for static site generation and local development.
To run this project locally, you need:

 - Ruby 2.7.0 (recommended to install using [Frum](https://github.com/TaKO8Ki/frum#installation))
 - Node 14 & NPM 6 (recommended to install using [NVM](https://github.com/nvm-sh/nvm#installing-and-updating))
 - [Bundler](https://bundler.io/)

## Install Ruby
To install Ruby 2.7.0, if you are using Frum, run the following command:
```console
$ frum install 2.7.0
```

## Install Node
To install Node 14, if you are using NVM, run the following command:
```console
$ nvm install 14
```

## Install Bundler
To install Bundler, run the following command:
```console
$ gem install bundler
```

## Install dependencies

 1. Clone the repository
 2. Switch your environment to Ruby 2.7.0 and Node 14:
	 1.  Run ``frum local 2.7.0``
	 2.  Run ``nvm use 14``
 3. To install the dependencies, from the root directory run:
	 1. ``bundle install``
	 2. ``npm ci``

# Running local server
With Jekyll and all the Ruby dependencies installed, run the following command:
```console
$ bundle exec jekyll serve -I
```

This will start up an HTTP server:
```console
 Auto-regeneration: enabled for '<path-to-your-project>'
    Server address: http://127.0.0.1:4000/
  Server running... press ctrl-c to stop.
      Regenerating: 1 file(s) changed at 2021-10-13 20:31:14
                    js/components/App.js
                    ...done in 3.726702727 seconds.
```

# Running tests
To run the tests, run the following command from the root directory:
```console
$ npx jest --watch
```

# Contributions
This project appreciates contributions whether they be code, bug reports or feature ideas. If you have ideas or encountered bugs, feel free to open an issue. If you would like to contribute code, try to find an open issue and discuss with maintainers before implementing and opening a PR.
