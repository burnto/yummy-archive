class CreateDeliciousUsers < ActiveRecord::Migration
  def self.up
    create_table :delicious_users do |t|
      t.column :username, :string
      t.column :password, :string
      t.column :xml, :string
      t.column :updated_at, :datetime
      t.column :created_at, :datetime
    end
  end

  def self.down
    drop_table :delicious_users
  end
end
