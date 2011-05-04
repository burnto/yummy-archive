require 'cgi'

class Hash
  
  def to_query_s
    self.map{|v| v.map{|x| CGI::escape(x.to_s)}.join("=") }.join("&")
  end
  
end