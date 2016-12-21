class Picture
  include Mongoid::Document
  include Mongoid::Paperclip

  embedded_in :photographic, inverse_of: :pictures, polymorphic: true

  has_mongoid_attached_file :attachment,
    styles: { small:  ['100x100^', :jpg],
              medium: ['250x250',  :jpg],
              large:  ['500x500>', :jpg],
              canopy: ['1200', :jpg] },
    convert_options: { all: '-background transparent -flatten +matte',
                       small: '-gravity center -extent 100x100' }
  validates_attachment_size :attachment, in: 1.byte..25.megabytes
  validates_attachment :attachment,
                       content_type: { content_type:
                         ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'] }

  # SEE: http://stackoverflow.com/a/23141483/1064917
  class << self
    def from_url(file_location, parent)
      pic = new(photographic: parent)
      if Paperclip::Attachment.default_options[:storage].to_s != 'filesystem'
        pic.attachment = open(file_location)
      else # it's a filesystem update
        # if it's already on the system, we don't need to update it.
        # if !file_location.include?('/system/')
          pic.attachment = open(file_location)
        # end

      end
      pic.save!
      pic
    end
    # handle_asynchronously :from_url
  end
end
