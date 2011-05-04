require 'delicious'

class SiteController < ApplicationController
        
  before_filter :set_expires
  
  def set_expires
    expires_in 1.minute
  end

  def index
    @user = "burnto"
    begin
      @taggings = retrieve_taggings @user, PASSWORD_HERE
    rescue Delicious::ResponseException => e
      @response_exception = e
    end

  end
  
  def posts
    @user = params[:username]
    begin
      @taggings = retrieve_taggings @user, params[:password]
      render(:update) do |page|
        page['warning'].hide()
        page << "tagContainer = new TagContainer(#{@taggings.to_json}, '#{@user}');"
        page << "mySlider.updateTags()"
      end
    rescue Delicious::ResponseException => e
      logger.info "error"
      render(:update) do |page|
        page['warning'].reload(:locals => {:user => @user, :message => e.message})
      end
    end
  end

  private
  def retrieve_taggings user, pass 
    u = Delicious::User.new(user, pass)
    return u.posts(:all)[1].map { |post|
      time = post.attributes["time"].to_time
      { :href => post.attributes["href"],
        :description => post.attributes["description"],
        :time => post.attributes["time"].to_time(:utc).rfc822,
        :tags => post.attributes["tag"].split }
    }
  end
    
end
