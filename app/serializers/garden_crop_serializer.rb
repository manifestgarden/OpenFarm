class GardenCropSerializer < BaseSerializer
  attribute :garden do
    object.garden.id
  end
  # This isn't very JSON-API, but it's a lot less
  # headache.
  attribute :guide do
    if object.guide
      { id: object.guide.id,
        name: object.guide.name,
        crop_id: object.guide.crop.id }
    end
  end
  attribute :crop do
    if object.crop
      { id: object.crop.id,
        name: object.crop.name }
    end
  end
  attribute :sowed
  attribute :stage
  attribute :quantity

  attribute :history do
    object.history_tracks
  end

  def self_link
    {
      'api': "/api/v1/gardens/#{object.garden.id}/garden_crops/#{object.id}",
      # 'website': "/users/#{object.user.id}/#gardens"
    }
  end
end
