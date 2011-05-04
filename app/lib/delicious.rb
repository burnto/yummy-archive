#!/usr/bin/env ruby

require 'net/https'
require 'base64'
require 'rexml/document'
require 'burnto.rb'

module Delicious
  
  class Request

    HOST = "api.del.icio.us"
    API_VERSION = "v1"
    
    def initialize username, password, path
      @username = username
      @password = password
      @path = req_path(path)

      @http = Net::HTTP.new(HOST, 443)
      @http.use_ssl = true
    end
    
    def run
      @http.start do |http|
         req = Net::HTTP::Get.new(@path)
         req.basic_auth @username, @password
         resp, data = http.request(req)
         raise Delicious::ResponseException.new(resp) unless resp.is_a?(Net::HTTPOK)
         return resp, parse_response(data)
      end
    end
    
    def parse_response data
      # puts data
      begin
        REXML::Document.new(data).root.elements
      rescue REXML::ParseException => e
        raise Delicious::ParseException.new("Couldn't parse the given data", data)
      end
    end
    
    def req_path path
      "/#{API_VERSION}/#{path}"
    end
    
  end

  class User
    
    def initialize(username, password)
      @username = username
      @password = password
    end

    def posts(method=:get, options={})
      Request.new(@username, 
                  @password, 
                  "posts/#{method}?#{options.to_query_s}").run
    end

  end
  
  class ParseException < Exception
    attr_reader :data
    def initialize message, data
      @data = data
      super(message)
    end
  end
  
  class ResponseException < Exception
    attr_reader :response
    def initialize response
      @response = response
      super(response.message)
    end
  end
  

end

# require 'pp'
# u = Delicious::User.new("burnto", "PASSWORD")
# u.posts[1].each do |post|
#   pp post.attributes["tag"]
# end
# require 'pp'
# pp Delicious::User.new("burnto", "PASSWORD").posts(:all)

if $PROGRAM_NAME == __FILE__
  require 'pp'
  pp Delicious::Request.new("burnto", 
              "PASSWORD", 
              "posts/all").run
end

