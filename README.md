## Multi ##

Multi is a framework for [web based multi-screen games](http://christine-coenen.de/blog/2013/11/14/web-based-multi-screen-games/) based on node.js and socket.io.
It allows to connect multiple devices to one game session, to sync player attributes across all clients and to combine the devices screens to one big playing field. Visit [christine-coenen.de/demos/multi/documentation](http://christine-coenen.de/demos/multi/documentation/) for the full documentation and some [tutorials](http://christine-coenen.de/demos/multi/documentation/tutorial-start.html).

### Requirements ###
- node.js (>= 0.8)
- NPM package manager (apt-get install npm)

### How to start ###
Before starting run `npm install` in your terminal.

To start the application run `node app` in your terminal and visit [http://localhost](http://localhost). 
The application tries to bind to port 80 - so this command may require root permission on unix systems. To bind multi to another port run `export PORT=<portnr>` before you start the app.

Before you check out the example games please make sure to adjust [public/js/SERVER.js](../js/SERVER.js) to your needs.

It is recommended to build the documentation with `grunt jsdoc`. 
After that you can view it under
[public/documentation/index.html](../documentation) or 
[http://localhost/documentation](http://localhost/documentation) 
when the server is running.

### Development ###

For development run:

- `grunt jsdoc` to generate documentation
- `grunt build` to build the client side library
- `grunt test` to run jshit and unit tests
- `grunt watch` to jshint files on change and build client side library when required

### API ###
To use Multi in your javaScript file you have to use require.js at the moment:

    // configure where multi can find your client side socket.io lib
    requirejs.config({
      paths: {
        'socket.io': '/socket.io/socket.io.js'
      }
    });
    
    // require the {@link module:client/multi} client side lib
    requirejs(['../lib/multi'], function (multiModule) {
      
      // say multi where to find the running socket server
      // via {@link module:client/multi~MultiOptions}
      var multiOptions = {
        server: 'http://mySocketioServer/'
      };
      
      // init multi with your options 
      // a {@link module:client/multi~Multi} instance will be returned
      var multi = multiModule.init(multiOptions);
      
      // create a new session with success and error callback
      // see: {@link module:client/multi~Multi#createSession}
      multi.createSession().then(onSession, onSessionFailed).done();
    };

For more examples of how to use the API visit the {@tutorial 01 quick start} tutorial.

### Bundled libraries ###
Multi comes with bundled libraries on client and server side:

- [q promises library](https://github.com/kriskowal/q) - The MIT License ([MIT])
- [watchJS](https://github.com/melanke/Watch.JS) - The MIT License ([MIT])

[MIT]: http://opensource.org/licenses/MIT

### Security ###
Multi is a bachelor thesis project and has not been security tested in any way. It uses no encryption ore secure handshaking at all and may be vulnerable to all kind of attacks. If you use it in production do so at your own risk.

### Licence ###

The MIT License ([MIT])

Copyright (c) 2013 cemrich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
