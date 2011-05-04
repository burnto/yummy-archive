
function debug(label, msg) {
  var d = $('debug');
  d.innerHTML = label + ": " + msg + "<br/>" + d.innerHTML;
}

function compareDates(date1, date2) {
  diff = date1 - date2;
  if(diff == 0) {
    return 0;
  }else if(diff > 0) {
    return 1;
  }else{
    return -1;
  }
}

function formattedDate(date) {
  return( pad(date.getUTCMonth()+1, 2) + "/" + pad(date.getUTCDate(), 2) + "/" + date.getUTCFullYear());
}

function shortFormattedDate(date) {
  return( pad(date.getUTCMonth()+1, 2) + "/" + pad(date.getUTCDate(), 2));
}

function pad(number,length) {
    var str = '' + number;
    while (str.length < length)
        str = '0' + str;
    return str;
}

function pluralizeUnits(num, label) {
  return (num + " " + label + (num == 1 ? "" : "s"));
}

var Tag = Class.create();
Tag.prototype  = {
  initialize: function(tag, user, container, container_object) {
    this.element = document.createElement("a");
    this.element.setAttribute("href", "http://del.icio.us/" + user + "/" + tag);
    this.element.innerHTML = tag;
    this.hide();
    container.appendChild(this.element);

    // Webkit hack to get the text to break. Stupid webkit.
    var space = document.createElement("span");
    space.innerHTML = " ";
    container.appendChild(space);
    
    this.element.onmouseover = function(evt){
      container_object.highlightBookmarks(tag, true);
    }.bindAsEventListener(this);
    this.element.onmouseout = function(evt){
      container_object.highlightBookmarks(tag, false);
    }.bindAsEventListener(this);
  },
  
  setSize: function(size) {
    Element.show(this.element);
/*    this.element.morph({fontSize: (8 + size) +'px'});*/
    this.element.style.fontSize = Math.min((9 + size), 50) + "px"
  },
  
  hide: function() {
    Element.hide(this.element);   
  },
  
  highlight: function(d) {
    if(d) {
      this.element.addClassName("hi");
    }else{
      this.element.removeClassName("hi");
    }
  }
}

var Bookmark = Class.create();
Bookmark.prototype = {
  initialize: function(tagging, container, container_object) {
    this.time = new Date(tagging.time);
    this.href = tagging.href;
    this.description = tagging.description;
    this.tags = tagging.tags;
    this.element = document.createElement("p");
    // Link/title
    var link = document.createElement("a");
    link.setAttribute("href", this.href);
    link.innerHTML = this.description;
    this.element.appendChild(link);
    // Put in a space
    this.element.appendChild(document.createTextNode(" "));
    // Add date
    var date = document.createElement("span");
    date.addClassName("bookmark_date");
    date.innerHTML = shortFormattedDate(this.time);
    this.element.appendChild(date);
    Element.hide(this.element);
    container.appendChild(this.element);
    this.element.firstChild.onmouseover = function(evt){
      container_object.highlightTags(this.tags, true);
    }.bindAsEventListener(this);
    this.element.firstChild.onmouseout = function(evt){
      container_object.highlightTags(this.tags, false);
    }.bindAsEventListener(this);
  },
  
  highlight: function(d) {
    if(d) {
      this.element.firstChild.addClassName("hi");
    }else{
      this.element.firstChild.removeClassName("hi");
    }
  },
  
  hide: function() {
    Element.hide(this.element);
  },
  
  show: function() {
    Element.show(this.element);
  }
}

var TagContainer = Class.create();
TagContainer.prototype = {
  initialize: function(taggings, user) {
    this.from_date_element = $("from_date");
    this.to_date_element = $("to_date");
    this.element = $("taggings");
    this.element.innerHTML = "";
    this.bookmarks_element = $("bookmarks");
    this.bookmarks_element.innerHTML = "";
    this.tag_bookmarks = $H();
    var container = this;
    this.bookmarks = taggings.map(function(t) {
      var bookmark = new Bookmark(t, this.bookmarks_element, this);
      // Stuff the bookmark into all its tags
      t.tags.each(function(tag) {
        // console.log([tag, typeof(tag), this.tag_bookmarks.get(tag), typeof(this.tag_bookmarks.get(tag))]);
        var b = this.tag_bookmarks.get(tag);
        // console.log(typeof(b))
        if(typeof(b) != "object") {
          this.tag_bookmarks.set(tag, [bookmark]);
        }else{
          b.push(bookmark);
        }
      }.bind(this));
      return(bookmark);
    }.bind(this));
    this.tags = $H();
    this.tag_bookmarks.keys().sort().each(function(tag) {
      this.tags.set(tag,  new Tag(tag, user, this.element, this));
    }.bind(this));
    if(this.bookmarks.length > 0) {
      this.bookmarks.sort(function(t1, t2) { 
        return compareDates(t1.time, t2.time);
      });
      this.startDate = this.bookmarks.first().time;
      this.endDate = this.bookmarks.last().time;
    }
  },
    
  updateRange: function(fromDate, toDate) {
    var counts = $H();
    this.num_tags = 0;
    this.num_bookmarks = 0;
    if(arguments.length == 0) {
      var fromDate = this.startDate;
      var toDate = this.endDate;
    }
    var container = this;
    this.bookmarks.each(function(bookmark) {
      // If we find a bookmark in our date range...
      if((compareDates(bookmark.time, fromDate) >= 0) && (compareDates(bookmark.time, toDate) <= 0)) {
        
        bookmark.show();
        container.num_bookmarks += 1;
        // Take each tag from the tagging and add it into the counts.
        bookmark.tags.each(function(tag) {
          if(counts.get(tag) == null) {
            counts.set(tag, 1);
          }else{
            counts.set(tag, counts.get(tag) + 1);
          }
        });
      }else{
        bookmark.hide();
      }
    });
    this.tags.values().each(function(v) {
      Element.hide(v.element);
    })
    var current_tags = counts.keys();
    current_tags.each(function(tag) {
      container.tags.get(tag).setSize(counts.get(tag));
    });
    this.num_tags = current_tags.length
  },
  
  updateHTML: function(from, to, max) {
    
    var startTime = this.startDate.getTime();
    var timeRange = this.endDate.getTime() - startTime;
    var scale = timeRange / max
    var fromDate = new Date(startTime + (from * scale));
    var toDate = new Date(startTime + (to * scale));
    
    this.updateRange(fromDate, toDate);

    // Update date text
    this.from_date_element.innerHTML = formattedDate(fromDate);
    this.to_date_element.innerHTML = formattedDate(toDate);
    $("bookmarks_title").innerHTML = pluralizeUnits(this.num_bookmarks, "bookmark");
    $("tags_title").innerHTML = pluralizeUnits(this.num_tags, "tag");
  },
  
  highlightBookmarks: function(tag, doHighlight) {
    this.tag_bookmarks.get(tag).each(function(b) {
      b.highlight(doHighlight);
    });
  },
  
  highlightTags: function(tags, doHighlight) {
    var container = this;
    tags.each(function(tag) {
      container.tags.get(tag).highlight(doHighlight);     
    });
  }
  
}

/* Slider */

var RangeSlider = Class.create();
RangeSlider.prototype = {
  initialize: function(track, handle1, handle2, range) {
    this.track = $(track);
    this.handle1 = $(handle1);
    this.handle_offset = Math.ceil(this.handle1.offsetWidth / -2);
    this.handle1.style.left = this.handle_offset + "px";
    this.handle2 = $(handle2);
    this.handle2.style.left = (this.track.offsetWidth + this.handle_offset) + "px";
    this.range_element = $(range);
    this.range = [];
    this.track.style.width = "100%";
    this.width = this.track.offsetWidth;
    this.track.style.width = this.track.offsetWidth + "px";
    var slider = this;
    [this.handle1, this.handle2].each(function(handle) {
      new Draggable(handle, {
              constraint:"horizontal",
              starteffect:null, endeffect:null, 
              change: function(d) {
                slider.handleDrag(d);
              },
              snap: function(x,y) {
                return [Math.max(slider.handle_offset,
                         Math.min(slider.track.offsetWidth + slider.handle_offset - 1, x)),
                     y]
              }
            });
    });
    new Draggable(this.range_element, {
            constraint:"horizontal",
            starteffect:false, endeffect:false,
            change: function(d) {
              slider.rangeDrag(d);
            },
            snap: function(x,y) {
              if(x < 0) {
                return [0,y]
              }else if(x + slider.range_element.offsetWidth > slider.track.offsetWidth - 1) {
                return [slider.track.offsetWidth - slider.range_element.offsetWidth - 1, y]
              }else return [x,y];
            }
          });
  },
  
  handleDrag: function(draggable) {
    var positions = [this.handle1, this.handle2].map(function(handle) {
      var x = handle.style.left;
      return parseInt(x.match(/(-)?\d+/)); // Get number
    });
    this.setRange(positions[0] - this.handle_offset, positions[1] - this.handle_offset);
    this.updateRange();
  },

  rangeDrag: function(draggable) {
    var p1 = parseInt(this.range_element.style.left.match(/\d+/));
    var p2 = parseInt(this.range_element.style.width.match(/\d+/));
    this.setRange(p1, p1 + p2);
    this.updateHandles();
  },

  updateRange: function() {
    this.range_element.style.left = this.range[0] + "px";
    this.range_element.style.width = (this.range[1] - this.range[0]) + "px";
  },
  
  updateHandles: function() {
    this.handle1.style.left = (this.range[0] + this.handle_offset) + "px";
    this.handle2.style.left = (this.range[1] + this.handle_offset) + "px";
  },
  
  getHandlePosition: function() {
    var h1px = parseInt(this.handle1.style.left.match(/\d+/)) - this.handle_offset;
    var h2px = parseInt(this.handle2.style.left.match(/\d+/)) - this.handle_offset;
    return [Math.min(h1px, h2px), Math.max(h1px, h2px)];
  },
  
  setRange: function(p1, p2) {
    this.range = [Math.min(p1, p2), Math.max(p1, p2)];
  },
  
  paint: function() {
    this.updateHandles();
    this.updateRange();
  },
  
  getRange: function() {
    return this.range;
  },
  
  updateTags: function() {
    tagContainer.updateHTML(this.range[0], this.range[1], this.width);
  },
  
  updateResizedPositions: function() {
    this.track.style.width = "100%";
    var ratio = this.track.offsetWidth / this.width;
    this.setRange(this.range[0] * ratio, this.range[1] * ratio);
    this.width = this.track.offsetWidth;
    this.track.style.width = this.track.offsetWidth + "px";
  },
  
  getValue: function() {
    return [this.range[0] / this.width, this.range[1] / this.width];
  }
}

/* Slider observers to highlight classes on drag start and end */

var SliderObserver = Class.create();
SliderObserver.prototype = {
  
  initialize: function() {
    this.element = $("debug");
  },
  
  onStart: function(eventName, draggable, event) {
    Element.addClassName(draggable.element, "draggable_hi");
  },
  
  onEnd: function(eventName, draggable, event) {
    Element.removeClassName(draggable.element, "draggable_hi");   
  }
}
Draggables.addObserver(new SliderObserver());

/* Custom timed value observer for updating the html of the tag container */

var ValueObserver = Class.create();
ValueObserver.prototype = {
  initialize: function(value_callback, value_compare, action_callback, frequency) {
    this.frequency = frequency;
    this.value_callback = value_callback;
  this.value_compare = value_compare;
    this.action_callback = action_callback;

    this.lastValue = this.value_callback();
    this.registerCallback();
  },

  registerCallback: function() {
    setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  onTimerEvent: function() {
    var value = this.value_callback();
    if (!this.value_compare(this.lastValue, value)) {
        this.action_callback(value);
        this.lastValue = value;
    }
  }
}

/* Create and set up slider, then update the tags. We do this in window.onload because webkit has some trouble with offsetWidth unless everything is already nicely loaded. */

var mySlider;
window.onload = function() {
  mySlider = new RangeSlider("track", "handle1", "handle2", "handle_range");
  mySlider.setRange(mySlider.width - (mySlider.width / 5), mySlider.width);
  mySlider.paint();
  mySlider.updateTags();
  new ValueObserver(function() {
              return mySlider.getValue();
            },
            function(v1, v2) {
              return( (v1[0] == v2[0]) && (v1[1] == v2[1]));
            },
            function() {
              mySlider.updateTags();
            },
            .4);
  
  /* Some window resizing extras */

  window.onresize = function() {
    mySlider.updateResizedPositions();
    mySlider.paint();
    mySlider.updateTags();
  }

  window.onresize();          
}



