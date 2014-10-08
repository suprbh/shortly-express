Shortly.Router = Backbone.Router.extend({
  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create',
    'logout': 'logout'
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    var links = new Shortly.Links();
    console.log("Shortly.Router: ",links);
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function(){
    console.log("Create in router.js");
    this.swapView(new Shortly.createLinkView());
  },

  logout: function(){
    console.log("Logout in router.js");
    var logout = new Shortly.Logout();
  }
});
